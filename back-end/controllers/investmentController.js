import Razorpay from "razorpay";
import { query } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const MIN_INVESTMENT_AMOUNT = 5;
const MIN_WITHDRAWAL_AMOUNT = 5;

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId) throw new Error("Set RAZORPAY_KEY (or RAZORPAY_KEY_ID) in .env with your Razorpay key.");
  if (!keySecret) throw new Error("Set RAZORPAY_KEY_SECRET in .env. Get it from Razorpay Dashboard → API Keys → reveal Secret (different from the key).");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
const MIN_HOLDING_DAYS_FOR_WITHDRAWAL = 15;
const EARLY_WITHDRAWAL_DEDUCTION_PERCENT = 3; // Before 15 days: deduct 3%, request goes to admin

function requireVerifiedKyc(rows) {
  if (!rows || rows.length === 0) return { allowed: false, message: "Please complete KYC first." };
  if (rows[0].status !== "VERIFIED") return { allowed: false, message: "Verification Pending. You can invest after verification." };
  return { allowed: true };
}

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await query(
    "SELECT id, name, category, min_amount, max_amount, interest_percentage, lockin_days FROM investment_plans WHERE is_active = 1 ORDER BY category, min_amount"
  );
  return sendSuccess(res, { plans });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const kycRows = await query("SELECT status FROM investment_kyc WHERE user_id = ?", [userId]);
  const kycStatus = kycRows.length > 0 ? kycRows[0].status : null;

  const [totalInvested] = await query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM investments WHERE user_id = ?",
    [userId]
  );
  const [activeCount] = await query(
    "SELECT COUNT(*) AS cnt FROM investments WHERE user_id = ? AND status = 'ACTIVE'",
    [userId]
  );
  const [maturedCount] = await query(
    "SELECT COUNT(*) AS cnt FROM investments WHERE user_id = ? AND status IN ('MATURED', 'WITHDRAWN')",
    [userId]
  );
  const withdrawals = await query(
    "SELECT SUM(w.interest_earned) AS earned FROM withdrawals w INNER JOIN investments i ON w.investment_id = i.id WHERE i.user_id = ?",
    [userId]
  );
  const totalEarnings = (withdrawals[0] && Number(withdrawals[0].earned)) || 0;

  const upcoming = await query(
    "SELECT id, amount, maturity_date, interest_percentage FROM investments WHERE user_id = ? AND status = 'ACTIVE' ORDER BY maturity_date ASC LIMIT 5",
    [userId]
  );

  const withdrawableRows = await query(
    `SELECT i.id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, DATEDIFF(CURDATE(), i.start_date) AS days_held
     FROM investments i WHERE i.user_id = ? AND i.status = 'ACTIVE'`,
    [userId]
  );
  let withdrawableBalance = 0;
  for (const inv of withdrawableRows) {
    const daysHeld = Number(inv.days_held) || 0;
    const principal = Number(inv.amount);
    const interest = daysHeld >= inv.lockin_days ? principal * (Number(inv.interest_percentage) / 100) : 0;
    withdrawableBalance += principal + interest;
  }

  const pendingWithdrawals = await query(
    `SELECT r.id, r.investment_id, r.requested_amount, r.amount_after_deduction, r.days_held, r.status, r.requested_at, i.amount AS investment_amount
     FROM investment_withdrawal_requests r
     JOIN investments i ON i.id = r.investment_id
     WHERE r.user_id = ? AND r.status = 'PENDING_APPROVAL'
     ORDER BY r.requested_at DESC`,
    [userId]
  );
  const recentApproved = await query(
    `SELECT r.id, r.investment_id, r.amount_after_deduction, r.status, r.reviewed_at,
      DATE_FORMAT(DATE_ADD(r.reviewed_at, INTERVAL 36 HOUR), '%Y-%m-%dT%H:%i:%s.000Z') AS settlement_date
     FROM investment_withdrawal_requests r
     WHERE r.user_id = ? AND r.status = 'APPROVED'
     ORDER BY r.reviewed_at DESC LIMIT 1`,
    [userId]
  );

  let referralBalancePending = 0;
  let referralBalanceApproved = 0;
  try {
    const [refPending] = await query(
      "SELECT COALESCE(SUM(referral_amount), 0) AS total FROM referral_earnings WHERE referrer_user_id = ? AND status = 'PENDING_APPROVAL'",
      [userId]
    );
    const [refApproved] = await query(
      "SELECT COALESCE(SUM(referral_amount), 0) AS total FROM referral_earnings WHERE referrer_user_id = ? AND status = 'APPROVED'",
      [userId]
    );
    referralBalancePending = parseFloat(refPending?.total) || 0;
    referralBalanceApproved = parseFloat(refApproved?.total) || 0;
  } catch (_) { /* referral_earnings table may not exist yet */ }
  withdrawableBalance = Math.round((withdrawableBalance + referralBalanceApproved) * 100) / 100;

  return sendSuccess(res, {
    kyc_status: kycStatus,
    total_invested: Number(totalInvested?.total) || 0,
    total_active: Number(activeCount?.cnt) || 0,
    total_matured: Number(maturedCount?.cnt) || 0,
    total_earnings: totalEarnings,
    upcoming_maturity: upcoming,
    withdrawable_balance: Number(withdrawableBalance),
    referral_balance_pending: Number(referralBalancePending),
    referral_balance_approved: Number(referralBalanceApproved),
    pending_withdrawal_requests: pendingWithdrawals,
    recent_approved_withdrawal: recentApproved.length > 0 ? recentApproved[0] : null,
  });
});

export const validateCheckout = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { plan_id, amount } = req.body;
  if (!plan_id || amount == null) return sendError(res, "plan_id and amount required", 400);

  const plans = await query("SELECT * FROM investment_plans WHERE id = ? AND is_active = 1", [plan_id]);
  if (plans.length === 0) return sendError(res, "Invalid plan", 404);

  const plan = plans[0];
  const amt = Number(amount);
  if (isNaN(amt) || amt < MIN_INVESTMENT_AMOUNT) {
    return sendError(res, `Minimum investment amount is ₹${MIN_INVESTMENT_AMOUNT}`, 400);
  }
  if (amt < Number(plan.min_amount) || amt > Number(plan.max_amount)) {
    return sendError(res, `Amount must be between ₹${plan.min_amount} and ₹${plan.max_amount}`, 400);
  }

  const startDate = new Date();
  const maturityDate = new Date(startDate);
  maturityDate.setDate(maturityDate.getDate() + plan.lockin_days);
  const interestAmount = amt * (Number(plan.interest_percentage) / 100);
  const estimatedReturn = amt + interestAmount;

  return sendSuccess(res, {
    plan_id: plan.id,
    plan_name: plan.name,
    amount: amt,
    interest_percentage: plan.interest_percentage,
    lockin_days: plan.lockin_days,
    start_date: startDate.toISOString().split("T")[0],
    maturity_date: maturityDate.toISOString().split("T")[0],
    estimated_return: Math.round(estimatedReturn * 100) / 100,
  });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { plan_id, amount } = req.body;
  if (!plan_id || amount == null) return sendError(res, "plan_id and amount required", 400);

  const plans = await query("SELECT * FROM investment_plans WHERE id = ? AND is_active = 1", [plan_id]);
  if (plans.length === 0) return sendError(res, "Invalid plan", 404);

  const plan = plans[0];
  const amt = Number(amount);
  if (isNaN(amt) || amt < MIN_INVESTMENT_AMOUNT) {
    return sendError(res, `Minimum investment amount is ₹${MIN_INVESTMENT_AMOUNT}`, 400);
  }
  if (amt < Number(plan.min_amount) || amt > Number(plan.max_amount)) {
    return sendError(res, `Amount must be between ₹${plan.min_amount} and ₹${plan.max_amount}`, 400);
  }

  const amountPaise = Math.round(amt * 100);
  if (amountPaise < 100) return sendError(res, "Amount must be at least ₹1", 400);

  const receipt = `inv_${userId}_${Date.now()}`;
  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes: { plan_id: String(plan_id), user_id: String(userId) },
  });

  return sendSuccess(res, {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  });
});

export const createInvestmentAfterPayment = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { plan_id, amount, transaction_id } = req.body;
  if (!plan_id || amount == null || !transaction_id) {
    return sendError(res, "plan_id, amount and transaction_id required", 400);
  }

  const duplicate = await query("SELECT id FROM investments WHERE user_id = ? AND transaction_id = ?", [userId, transaction_id]);
  if (duplicate.length > 0) return sendSuccess(res, { investment_id: duplicate[0].id }, "Investment already recorded (idempotent).");

  const plans = await query("SELECT * FROM investment_plans WHERE id = ? AND is_active = 1", [plan_id]);
  if (plans.length === 0) return sendError(res, "Invalid plan", 404);

  const plan = plans[0];
  const amt = Number(amount);
  if (isNaN(amt) || amt < MIN_INVESTMENT_AMOUNT) {
    return sendError(res, `Minimum investment amount is ₹${MIN_INVESTMENT_AMOUNT}`, 400);
  }
  if (amt < Number(plan.min_amount) || amt > Number(plan.max_amount)) {
    return sendError(res, "Invalid amount for plan", 400);
  }

  const startDate = new Date();
  const maturityDate = new Date(startDate);
  maturityDate.setDate(maturityDate.getDate() + plan.lockin_days);

  const result = await query(
    `INSERT INTO investments (user_id, plan_id, amount, interest_percentage, lockin_days, start_date, maturity_date, status, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    [userId, plan_id, amt, plan.interest_percentage, plan.lockin_days, startDate.toISOString().split("T")[0], maturityDate.toISOString().split("T")[0], transaction_id]
  );
  const insertId = result.insertId;

  await query(
    "INSERT INTO investment_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, 'INVESTMENT_CREATED', 'investment', ?, ?)",
    [userId, insertId, JSON.stringify({ amount: amt, plan_id, transaction_id })]
  );

  const maturityStr = maturityDate.toISOString().split("T")[0];
  await query(
    "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, "Investment Successful", `Your maturity date is ${maturityStr}.`]
  );

  // Referral: 2% of referred user's first investment to referrer (pending admin approval)
  try {
    const investmentCount = await query("SELECT COUNT(*) AS cnt FROM investments WHERE user_id = ?", [userId]);
    const isFirstInvestment = Number(investmentCount[0]?.cnt) === 1;
    if (isFirstInvestment) {
      const userRows = await query("SELECT referred_by_user_id FROM challenge_users WHERE id = ?", [userId]);
      const referredByUserId = userRows[0]?.referred_by_user_id;
      if (referredByUserId != null) {
        const referralAmount = Math.round(amt * 0.02 * 100) / 100;
        if (referralAmount > 0) {
          await query(
            `INSERT INTO referral_earnings (referrer_user_id, referred_user_id, investment_id, first_investment_amount, referral_amount, status)
             VALUES (?, ?, ?, ?, ?, 'PENDING_APPROVAL')`,
            [referredByUserId, userId, insertId, amt, referralAmount]
          );
        }
      }
    }
  } catch (err) {
    console.warn("[createInvestmentAfterPayment] Referral creation skipped:", err.message);
  }

  return sendSuccess(res, {
    investment_id: insertId,
    amount: amt,
    maturity_date: maturityStr,
    status: "ACTIVE",
  }, "Investment created.");
});

export const listInvestments = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const list = await query(
    `SELECT i.id, i.plan_id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, i.status, i.transaction_id, i.created_at,
      p.name AS plan_name, p.category,
      w.withdrawn_at, w.withdrawal_amount,
      (CASE WHEN w.id IS NOT NULL THEN DATE_FORMAT(DATE_ADD(w.withdrawn_at, INTERVAL 36 HOUR), '%Y-%m-%dT%H:%i:%s.000Z') END) AS settlement_date,
      (CASE WHEN w.id IS NOT NULL THEN w.withdrawal_amount END) AS settlement_amount
     FROM investments i
     LEFT JOIN investment_plans p ON i.plan_id = p.id
     LEFT JOIN withdrawals w ON w.investment_id = i.id
     WHERE i.user_id = ? ORDER BY i.created_at DESC`,
    [userId]
  );
  return sendSuccess(res, { investments: list });
});

export const getReferralStats = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  let pending = 0;
  let approved = 0;
  let totalReferrals = 0;
  try {
    const [p] = await query(
      "SELECT COALESCE(SUM(referral_amount), 0) AS total FROM referral_earnings WHERE referrer_user_id = ? AND status = 'PENDING_APPROVAL'",
      [userId]
    );
    const [a] = await query(
      "SELECT COALESCE(SUM(referral_amount), 0) AS total FROM referral_earnings WHERE referrer_user_id = ? AND status = 'APPROVED'",
      [userId]
    );
    const [c] = await query(
      "SELECT COUNT(*) AS cnt FROM referral_earnings WHERE referrer_user_id = ?",
      [userId]
    );
    pending = Number(p?.total) || 0;
    approved = Number(a?.total) || 0;
    totalReferrals = Number(c?.cnt) || 0;
  } catch (_) { /* table may not exist */ }
  return sendSuccess(res, {
    referral_balance_pending: pending,
    referral_balance_approved: approved,
    total_referrals: totalReferrals,
  });
});

export const getReferralHistory = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  let list = [];
  try {
    list = await query(
      `SELECT r.id, r.referred_user_id, r.investment_id, r.first_investment_amount, r.referral_amount, r.status, r.created_at, r.approved_at,
        u.email AS referred_email, u.name AS referred_name
       FROM referral_earnings r
       JOIN challenge_users u ON u.id = r.referred_user_id
       WHERE r.referrer_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
  } catch (_) { /* table may not exist */ }
  return sendSuccess(res, { referral_history: list });
});

export const getWithdrawPreview = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { investment_id } = req.params;
  const kycRows = await query("SELECT status FROM investment_kyc WHERE user_id = ?", [userId]);
  const check = requireVerifiedKyc(kycRows);

  const invRows = await query(
    "SELECT i.*, p.name AS plan_name FROM investments i LEFT JOIN investment_plans p ON i.plan_id = p.id WHERE i.id = ? AND i.user_id = ?",
    [investment_id, userId]
  );
  if (invRows.length === 0) return sendError(res, "Investment not found", 404);
  const inv = invRows[0];
  if (inv.status !== "ACTIVE") return sendError(res, "Investment is not active", 400);

  const start = new Date(inv.start_date);
  const today = new Date();
  const daysCompleted = Math.floor((today - start) / (24 * 60 * 60 * 1000));
  const principal = Number(inv.amount);
  const eligibleInterest = daysCompleted >= inv.lockin_days ? principal * (Number(inv.interest_percentage) / 100) : 0;
  const totalWithdrawable = principal + eligibleInterest;
  const isEarlyWithdrawal = daysCompleted < MIN_HOLDING_DAYS_FOR_WITHDRAWAL;
  const deductionPercent = isEarlyWithdrawal ? EARLY_WITHDRAWAL_DEDUCTION_PERCENT : 0;
  const deductionAmount = isEarlyWithdrawal ? Math.round((totalWithdrawable * (deductionPercent / 100)) * 100) / 100 : 0;
  const amountAfterDeduction = Math.round((totalWithdrawable - deductionAmount) * 100) / 100;
  const effectiveAmount = amountAfterDeduction;
  const meetsMinWithdrawal = effectiveAmount >= MIN_WITHDRAWAL_AMOUNT;

  const requestRows = await query(
    "SELECT id, status, requested_amount, deduction_amount, amount_after_deduction, requested_at, reviewed_at, admin_note, settlement_status, settlement_date FROM investment_withdrawal_requests WHERE investment_id = ? ORDER BY requested_at DESC LIMIT 1",
    [inv.id]
  );
  const withdrawalRequest = requestRows.length > 0 ? requestRows[0] : null;
  const payload = {
    investment_id: inv.id,
    invested_amount: principal,
    days_completed: daysCompleted,
    days_holding: daysCompleted,
    min_holding_days: MIN_HOLDING_DAYS_FOR_WITHDRAWAL,
    can_withdraw: check.allowed ? meetsMinWithdrawal : false,
    min_withdrawal_amount: MIN_WITHDRAWAL_AMOUNT,
    early_withdrawal: isEarlyWithdrawal,
    early_withdrawal_deduction_percent: deductionPercent,
    deduction_amount: deductionAmount,
    amount_after_deduction: amountAfterDeduction,
    requires_approval: isEarlyWithdrawal,
    lockin_days: inv.lockin_days,
    interest_percentage: inv.interest_percentage,
    eligible_interest: Math.round(eligibleInterest * 100) / 100,
    total_withdrawable: Math.round(totalWithdrawable * 100) / 100,
    lockin_completed: daysCompleted >= inv.lockin_days,
    current_datetime: new Date().toISOString(),
  };
  if (!check.allowed) {
    payload.kyc_required = true;
    payload.kyc_message = check.message || "Complete KYC verification to withdraw. Go to Investment → KYC and submit your details.";
  }
  if (withdrawalRequest) {
    payload.withdrawal_request_status = withdrawalRequest.status;
    payload.withdrawal_requested_at = withdrawalRequest.requested_at;
    payload.withdrawal_reviewed_at = withdrawalRequest.reviewed_at;
    payload.withdrawal_admin_note = withdrawalRequest.admin_note;
    payload.withdrawal_request_amount = Number(withdrawalRequest.amount_after_deduction);
    if (withdrawalRequest.status === "APPROVED" && withdrawalRequest.reviewed_at) {
      const storedDate = withdrawalRequest.settlement_date;
      if (storedDate) {
        payload.settlement_date = storedDate instanceof Date ? storedDate.toISOString() : String(storedDate).slice(0, 10) + "T12:00:00.000Z";
      } else {
        const reviewed = new Date(withdrawalRequest.reviewed_at);
        payload.settlement_date = new Date(reviewed.getTime() + 36 * 60 * 60 * 1000).toISOString();
      }
      payload.settlement_amount = Number(withdrawalRequest.amount_after_deduction);
    }
  }

  return sendSuccess(res, payload);
});

export const withdraw = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { investment_id } = req.body;
  if (!investment_id) return sendError(res, "investment_id required", 400);

  const kycRows = await query("SELECT status FROM investment_kyc WHERE user_id = ?", [userId]);
  const check = requireVerifiedKyc(kycRows);
  if (!check.allowed) return sendError(res, "Complete KYC verification to withdraw. Go to Investment → KYC and submit your details.", 403);

  const invRows = await query("SELECT * FROM investments WHERE id = ? AND user_id = ?", [investment_id, userId]);
  if (invRows.length === 0) return sendError(res, "Investment not found", 404);
  const inv = invRows[0];
  if (inv.status !== "ACTIVE") return sendError(res, "Investment is not active", 400);

  const start = new Date(inv.start_date);
  const today = new Date();
  const daysCompleted = Math.floor((today - start) / (24 * 60 * 60 * 1000));
  const principal = Number(inv.amount);
  const interestEarned = daysCompleted >= inv.lockin_days ? principal * (Number(inv.interest_percentage) / 100) : 0;
  const totalWithdrawable = principal + interestEarned;
  const deductionAmountForMin = daysCompleted < MIN_HOLDING_DAYS_FOR_WITHDRAWAL
    ? Math.round((totalWithdrawable * (EARLY_WITHDRAWAL_DEDUCTION_PERCENT / 100)) * 100) / 100
    : 0;
  const amountAfterDeductionForMin = Math.round((totalWithdrawable - deductionAmountForMin) * 100) / 100;
  if (amountAfterDeductionForMin < MIN_WITHDRAWAL_AMOUNT) {
    return sendError(res, `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}. Your amount is ₹${amountAfterDeductionForMin.toFixed(2)}.`, 400);
  }

  if (daysCompleted < MIN_HOLDING_DAYS_FOR_WITHDRAWAL) {
    const deductionAmount = Math.round((totalWithdrawable * (EARLY_WITHDRAWAL_DEDUCTION_PERCENT / 100)) * 100) / 100;
    const amountAfterDeduction = Math.round((totalWithdrawable - deductionAmount) * 100) / 100;
    const pending = await query(
      "SELECT id FROM investment_withdrawal_requests WHERE investment_id = ? AND status = 'PENDING_APPROVAL'",
      [inv.id]
    );
    if (pending.length > 0) return sendError(res, "A withdrawal request for this investment is already pending approval.", 400);

    await query(
      `INSERT INTO investment_withdrawal_requests (user_id, investment_id, requested_amount, deduction_percent, deduction_amount, amount_after_deduction, days_held, status, requested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', UTC_TIMESTAMP())`,
      [userId, inv.id, totalWithdrawable, EARLY_WITHDRAWAL_DEDUCTION_PERCENT, deductionAmount, amountAfterDeduction, daysCompleted]
    );
    await query(
      "INSERT INTO investment_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, 'WITHDRAWAL_REQUEST', 'withdrawal_request', ?, ?)",
      [userId, inv.id, JSON.stringify({ requested_amount: totalWithdrawable, deduction_amount: deductionAmount, amount_after_deduction: amountAfterDeduction })]
    );
    return sendSuccess(res, {
      investment_id: inv.id,
      status: "PENDING_APPROVAL",
      message: "Withdrawal request submitted. 3% deduction applies. It will be processed after admin approval.",
      amount_after_deduction: amountAfterDeduction,
    }, "Withdrawal request submitted for admin approval.");
  }

  const withdrawalAmount = totalWithdrawable;
  await query("UPDATE investments SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [inv.id]);
  await query(
    "INSERT INTO withdrawals (investment_id, principal_amount, interest_earned, withdrawal_amount) VALUES (?, ?, ?, ?)",
    [inv.id, principal, interestEarned, withdrawalAmount]
  );
  await query(
    "INSERT INTO investment_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, 'WITHDRAWAL', 'withdrawal', ?, ?)",
    [userId, inv.id, JSON.stringify({ withdrawal_amount: withdrawalAmount, interest_earned: interestEarned })]
  );

  return sendSuccess(res, {
    investment_id: inv.id,
    withdrawal_amount: Math.round(withdrawalAmount * 100) / 100,
    interest_earned: Math.round(interestEarned * 100) / 100,
    status: "WITHDRAWN",
  }, "Withdrawal processed.");
});

export const getReports = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { date_from, date_to, status, plan_type, amount_min, amount_max } = req.query;

  let sql = `SELECT i.id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, i.status, i.created_at, p.name AS plan_name, p.category,
    DATEDIFF(COALESCE(DATE(w.withdrawn_at), CURDATE()), i.start_date) AS days_held,
    COALESCE(w.interest_earned, 0) AS earned_amount,
    w.withdrawn_at, w.withdrawal_amount,
    (CASE WHEN wr.settlement_date IS NOT NULL THEN DATE_FORMAT(wr.settlement_date, '%Y-%m-%dT12:00:00.000Z') WHEN w.id IS NOT NULL THEN DATE_FORMAT(DATE_ADD(w.withdrawn_at, INTERVAL 36 HOUR), '%Y-%m-%dT%H:%i:%s.000Z') END) AS settlement_date,
    (CASE WHEN w.id IS NOT NULL THEN w.withdrawal_amount END) AS settlement_amount,
    wr.settlement_status
    FROM investments i
    LEFT JOIN investment_plans p ON i.plan_id = p.id
    LEFT JOIN withdrawals w ON w.investment_id = i.id
    LEFT JOIN (
    SELECT investment_id, settlement_status, settlement_date FROM investment_withdrawal_requests
    WHERE status = 'APPROVED' AND id IN (SELECT MAX(id) FROM investment_withdrawal_requests WHERE status = 'APPROVED' GROUP BY investment_id)
  ) wr ON wr.investment_id = i.id
    WHERE i.user_id = ?`;
  const params = [userId];

  if (date_from) { sql += " AND i.start_date >= ?"; params.push(date_from); }
  if (date_to) { sql += " AND i.start_date <= ?"; params.push(date_to); }
  if (status) { sql += " AND i.status = ?"; params.push(status); }
  if (plan_type) { sql += " AND p.category = ?"; params.push(plan_type); }
  if (amount_min != null && amount_min !== "") { sql += " AND i.amount >= ?"; params.push(Number(amount_min)); }
  if (amount_max != null && amount_max !== "") { sql += " AND i.amount <= ?"; params.push(Number(amount_max)); }

  sql += " ORDER BY i.created_at DESC";
  const rows = await query(sql, params);
  return sendSuccess(res, { reports: rows });
});

export const getReportById = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { id } = req.params;
  const rows = await query(
    `SELECT i.id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, i.status, i.created_at, i.transaction_id, p.name AS plan_name, p.category,
      DATEDIFF(COALESCE(DATE(w.withdrawn_at), CURDATE()), i.start_date) AS days_held,
      COALESCE(w.interest_earned, 0) AS earned_amount, w.withdrawn_at, w.withdrawal_amount,
      (CASE WHEN wr.settlement_date IS NOT NULL THEN DATE_FORMAT(wr.settlement_date, '%Y-%m-%dT12:00:00.000Z') WHEN w.id IS NOT NULL THEN DATE_FORMAT(DATE_ADD(w.withdrawn_at, INTERVAL 36 HOUR), '%Y-%m-%dT%H:%i:%s.000Z') END) AS settlement_date,
      (CASE WHEN w.id IS NOT NULL THEN w.withdrawal_amount END) AS settlement_amount,
      wr.settlement_status
     FROM investments i
     LEFT JOIN investment_plans p ON i.plan_id = p.id
     LEFT JOIN withdrawals w ON w.investment_id = i.id
     LEFT JOIN (
     SELECT investment_id, settlement_status, settlement_date FROM investment_withdrawal_requests
     WHERE status = 'APPROVED' AND id IN (SELECT MAX(id) FROM investment_withdrawal_requests WHERE status = 'APPROVED' GROUP BY investment_id)
   ) wr ON wr.investment_id = i.id
     WHERE i.user_id = ? AND i.id = ?`,
    [userId, id]
  );
  if (rows.length === 0) return sendError(res, "Report not found", 404);
  return sendSuccess(res, rows[0]);
});

// Admin: get investment reports for any user (user_id in query)
export const getReportsAdmin = asyncHandler(async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return sendError(res, "user_id is required", 400);
  const { date_from, date_to, status, plan_type, amount_min, amount_max } = req.query;

  let sql = `SELECT i.id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, i.status, i.created_at, p.name AS plan_name, p.category,
    DATEDIFF(COALESCE(DATE(w.withdrawn_at), CURDATE()), i.start_date) AS days_held,
    COALESCE(w.interest_earned, 0) AS earned_amount
    FROM investments i
    LEFT JOIN investment_plans p ON i.plan_id = p.id
    LEFT JOIN withdrawals w ON w.investment_id = i.id
    WHERE i.user_id = ?`;
  const params = [userId];

  if (date_from) { sql += " AND i.start_date >= ?"; params.push(date_from); }
  if (date_to) { sql += " AND i.start_date <= ?"; params.push(date_to); }
  if (status) { sql += " AND i.status = ?"; params.push(status); }
  if (plan_type) { sql += " AND p.category = ?"; params.push(plan_type); }
  if (amount_min != null && amount_min !== "") { sql += " AND i.amount >= ?"; params.push(Number(amount_min)); }
  if (amount_max != null && amount_max !== "") { sql += " AND i.amount <= ?"; params.push(Number(amount_max)); }

  sql += " ORDER BY i.created_at DESC";
  const rows = await query(sql, params);
  return sendSuccess(res, { reports: rows });
});

// Admin: get single investment report by id (any user)
export const getReportByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await query(
    `SELECT i.id, i.amount, i.interest_percentage, i.lockin_days, i.start_date, i.maturity_date, i.status, i.created_at, i.transaction_id, p.name AS plan_name, p.category,
      DATEDIFF(COALESCE(DATE(w.withdrawn_at), CURDATE()), i.start_date) AS days_held,
      COALESCE(w.interest_earned, 0) AS earned_amount, w.withdrawn_at
     FROM investments i
     LEFT JOIN investment_plans p ON i.plan_id = p.id
     LEFT JOIN withdrawals w ON w.investment_id = i.id
     WHERE i.id = ?`,
    [id]
  );
  if (rows.length === 0) return sendError(res, "Report not found", 404);
  return sendSuccess(res, rows[0]);
});

// Admin: list withdrawal requests (pending or all)
export const listWithdrawalRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `SELECT r.id, r.user_id, r.investment_id, r.requested_amount, r.deduction_percent, r.deduction_amount, r.amount_after_deduction, r.days_held, r.status, r.requested_at, r.reviewed_at, r.admin_note, r.settlement_status, r.settlement_date,
    i.amount AS investment_amount, i.start_date, i.interest_percentage, i.lockin_days,
    p.name AS plan_name,
    c.name AS user_name, c.email AS user_email, c.phone AS user_phone
    FROM investment_withdrawal_requests r
    JOIN investments i ON i.id = r.investment_id
    LEFT JOIN investment_plans p ON p.id = i.plan_id
    LEFT JOIN challenge_users c ON c.id = r.user_id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += " AND r.status = ?"; params.push(status); }
  sql += " ORDER BY r.requested_at DESC";
  const rows = await query(sql, params);
  // Normalize timestamps to ISO UTC so frontend displays correct local time
  const toIsoUtc = (d) => (d instanceof Date ? d.toISOString() : d == null ? null : new Date(d).toISOString());
  const toDateStr = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d == null ? null : String(d).slice(0, 10));
  const requests = (rows || []).map((r) => ({
    ...r,
    requested_at: toIsoUtc(r.requested_at),
    reviewed_at: toIsoUtc(r.reviewed_at),
    settlement_date: toDateStr(r.settlement_date),
  }));
  return sendSuccess(res, { requests });
});

// Admin: approve or reject withdrawal request; or update settlement (status/date) for approved requests
export const updateWithdrawalRequestStatus = asyncHandler(async (req, res) => {
  const adminUserId = req.user?.id;
  const { id } = req.params;
  const { status, admin_note, settlement_status: bodySettlementStatus, settlement_date: bodySettlementDate } = req.body;

  const existing = await query("SELECT * FROM investment_withdrawal_requests WHERE id = ?", [id]);
  if (existing.length === 0) return sendError(res, "Withdrawal request not found", 404);
  const reqRow = existing[0];
  const isApproved = reqRow.status === "APPROVED";

  // Update settlement only (for already-approved requests)
  if (isApproved && (bodySettlementStatus != null || bodySettlementDate != null)) {
    const allowedStatuses = ["PENDING", "PROCESSING", "SETTLED"];
    if (bodySettlementStatus != null && !allowedStatuses.includes(bodySettlementStatus)) {
      return sendError(res, "settlement_status must be PENDING, PROCESSING, or SETTLED", 400);
    }
    const updates = [];
    const params = [];
    if (bodySettlementStatus != null) {
      updates.push("settlement_status = ?");
      params.push(bodySettlementStatus);
    }
    if (bodySettlementDate !== undefined) {
      updates.push("settlement_date = ?");
      params.push(bodySettlementDate && bodySettlementDate.trim() !== "" ? bodySettlementDate.trim() : null);
    }
    if (updates.length === 0) return sendSuccess(res, { request_id: id }, "No settlement fields to update.");
    params.push(id);
    await query(
      `UPDATE investment_withdrawal_requests SET ${updates.join(", ")} WHERE id = ? AND status = 'APPROVED'`,
      params
    );
    return sendSuccess(res, { request_id: id, settlement_status: bodySettlementStatus, settlement_date: bodySettlementDate || null }, "Settlement updated.");
  }

  // Approve or reject (only when current status is PENDING_APPROVAL)
  if (!status || !["APPROVED", "REJECTED"].includes(status)) return sendError(res, "status must be APPROVED or REJECTED", 400);
  if (reqRow.status !== "PENDING_APPROVAL") return sendError(res, "Request is not pending approval", 400);

  const investmentId = reqRow.investment_id;
  const userId = reqRow.user_id;
  const amountAfterDeduction = Number(reqRow.amount_after_deduction);

  await query(
    "UPDATE investment_withdrawal_requests SET status = ?, reviewed_at = UTC_TIMESTAMP(), reviewed_by = ?, admin_note = ?, settlement_status = IF(? = 'APPROVED', 'PENDING', NULL), settlement_date = IF(? = 'APPROVED', DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 36 HOUR)), NULL) WHERE id = ?",
    [status, adminUserId || null, admin_note || null, status, status, id]
  );

  if (status === "REJECTED") {
    await query(
      "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
      [userId, "Withdrawal request declined", admin_note ? `Your early withdrawal request was declined. Note: ${admin_note}` : "Your early withdrawal request was declined."]
    );
    return sendSuccess(res, { request_id: id, status: "REJECTED" }, "Withdrawal request rejected.");
  }

  const invRows = await query("SELECT * FROM investments WHERE id = ? AND user_id = ? AND status = 'ACTIVE'", [investmentId, userId]);
  if (invRows.length === 0) return sendError(res, "Investment no longer active or not found", 400);
  const inv = invRows[0];
  const principal = Number(inv.amount);
  const interestEarned = Math.round(Math.max(0, amountAfterDeduction - principal) * 100) / 100;

  await query("UPDATE investments SET status = 'WITHDRAWN', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [investmentId]);
  await query(
    "INSERT INTO withdrawals (investment_id, principal_amount, interest_earned, withdrawal_amount) VALUES (?, ?, ?, ?)",
    [investmentId, principal, interestEarned, amountAfterDeduction]
  );
  await query(
    "INSERT INTO investment_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, 'WITHDRAWAL', 'withdrawal', ?, ?)",
    [userId, investmentId, JSON.stringify({ withdrawal_amount: amountAfterDeduction, early_withdrawal_request_id: id, admin_approved: true })]
  );
  await query(
    "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, "Withdrawal approved", `Your early withdrawal request has been approved. Amount credited: ₹${amountAfterDeduction.toFixed(2)} (after 3% deduction).`]
  );

  return sendSuccess(res, { request_id: id, status: "APPROVED", withdrawal_amount: amountAfterDeduction }, "Withdrawal approved and processed.");
});

export const listReferralEarningsForAdmin = asyncHandler(async (req, res) => {
  const { status, date_from, date_to, referrer_email, referred_email, referrer_id, referred_id } = req.query;
  let list = [];
  try {
    const conditions = [];
    const params = [];

    if (status && ["PENDING_APPROVAL", "APPROVED", "REJECTED"].includes(String(status).trim())) {
      conditions.push("r.status = ?");
      params.push(String(status).trim());
    }
    if (date_from && String(date_from).trim()) {
      conditions.push("DATE(r.created_at) >= ?");
      params.push(String(date_from).trim().slice(0, 10));
    }
    if (date_to && String(date_to).trim()) {
      conditions.push("DATE(r.created_at) <= ?");
      params.push(String(date_to).trim().slice(0, 10));
    }
    if (referrer_id && String(referrer_id).trim()) {
      conditions.push("r.referrer_user_id = ?");
      params.push(parseInt(referrer_id, 10));
    } else if (referrer_email && String(referrer_email).trim()) {
      conditions.push("LOWER(referrer.email) LIKE LOWER(?)");
      params.push(`%${String(referrer_email).trim()}%`);
    }
    if (referred_id && String(referred_id).trim()) {
      conditions.push("r.referred_user_id = ?");
      params.push(parseInt(referred_id, 10));
    } else if (referred_email && String(referred_email).trim()) {
      conditions.push("LOWER(referred.email) LIKE LOWER(?)");
      params.push(`%${String(referred_email).trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    list = await query(
      `SELECT r.id, r.referrer_user_id, r.referred_user_id, r.investment_id, r.first_investment_amount, r.referral_amount, r.status, r.created_at, r.approved_at,
        referrer.email AS referrer_email, referrer.name AS referrer_name,
        referred.email AS referred_email, referred.name AS referred_name
       FROM referral_earnings r
       JOIN challenge_users referrer ON referrer.id = r.referrer_user_id
       JOIN challenge_users referred ON referred.id = r.referred_user_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );
  } catch (err) {
    console.error("[listReferralEarningsForAdmin]", err.message);
  }
  return sendSuccess(res, { referral_earnings: list });
});

/**
 * Backfill missing referral_earnings for users who have referred_by_user_id and have
 * already made their first investment (e.g. user was referred before the feature or
 * referral record failed to create). Creates one row per referred user's first investment.
 */
export const backfillReferralEarnings = asyncHandler(async (req, res) => {
  let created = 0;
  try {
    const referredUsers = await query(
      "SELECT id AS referred_user_id, referred_by_user_id FROM challenge_users WHERE referred_by_user_id IS NOT NULL"
    );
    for (const u of referredUsers) {
      const firstInv = await query(
        "SELECT id, amount FROM investments WHERE user_id = ? ORDER BY id ASC LIMIT 1",
        [u.referred_user_id]
      );
      if (firstInv.length === 0) continue;
      const inv = firstInv[0];
      const existing = await query("SELECT id FROM referral_earnings WHERE investment_id = ?", [inv.id]);
      if (existing.length > 0) continue;
      const referralAmount = Math.round(Number(inv.amount) * 0.02 * 100) / 100;
      if (referralAmount <= 0) continue;
      await query(
        `INSERT INTO referral_earnings (referrer_user_id, referred_user_id, investment_id, first_investment_amount, referral_amount, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING_APPROVAL')`,
        [u.referred_by_user_id, u.referred_user_id, inv.id, Number(inv.amount), referralAmount]
      );
      created += 1;
    }
  } catch (err) {
    console.error("[backfillReferralEarnings]", err.message);
    return sendError(res, err.message || "Backfill failed", 500);
  }
  return sendSuccess(res, { created }, created > 0 ? `Created ${created} missing referral record(s).` : "No missing referral records to create.");
});

export const approveReferralEarning = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["APPROVED", "REJECTED"].includes(status)) {
    return sendError(res, "status must be APPROVED or REJECTED", 400);
  }
  const rows = await query("SELECT id, referrer_user_id, referred_user_id, referral_amount, status FROM referral_earnings WHERE id = ?", [id]);
  if (rows.length === 0) return sendError(res, "Referral earning not found", 404);
  const row = rows[0];
  if (row.status !== "PENDING_APPROVAL") return sendError(res, "Referral is not pending approval", 400);
  await query(
    "UPDATE referral_earnings SET status = ?, approved_at = UTC_TIMESTAMP() WHERE id = ?",
    [status, id]
  );
  if (status === "APPROVED") {
    await query(
      "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
      [row.referrer_user_id, "Referral approved", `Your referral bonus of ₹${Number(row.referral_amount).toFixed(2)} has been approved and is now withdrawable.`]
    );
  }
  return sendSuccess(res, { id: Number(id), status }, status === "APPROVED" ? "Referral approved." : "Referral rejected.");
});

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const rows = await query(
    "SELECT id, title, message, read_at, created_at FROM investment_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
  return sendSuccess(res, { notifications: rows });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { id } = req.params;
  await query("UPDATE investment_notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", [id, userId]);
  return sendSuccess(res, null, "Marked as read");
});
