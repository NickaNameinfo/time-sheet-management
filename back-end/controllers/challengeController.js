import { getTenantQuery } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayName(date) {
  const d = new Date(date);
  return DAY_NAMES[d.getDay()];
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export const createChallenge = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const { title, description, total_days, start_date, reminder_time } = req.body;

  if (!title || !total_days || !start_date) {
    return sendError(res, "Title, total_days and start_date are required", 400);
  }

  const totalDays = parseInt(total_days, 10);
  if (totalDays < 1 || totalDays > 365) {
    return sendError(res, "total_days must be between 1 and 365", 400);
  }

  const startDate = new Date(start_date);
  if (isNaN(startDate.getTime())) {
    return sendError(res, "Invalid start_date", 400);
  }

  const reminderTime = reminder_time || null;

  const insertChallenge = await q(
    "INSERT INTO challenges (user_id, title, description, total_days, start_date, reminder_time, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
    [
      userId,
      String(title).trim(),
      description ? String(description).trim() : null,
      totalDays,
      start_date,
      reminderTime,
    ]
  );
  const challengeId = insertChallenge.insertId;

  const dayInserts = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(startDate, i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = getDayName(d);
    dayInserts.push([challengeId, i + 1, dateStr, dayName]);
  }

  const placeholders = dayInserts.map(() => "(?, ?, ?, ?, 'pending')").join(", ");
  const values = dayInserts.flat();
  await q(
    "INSERT INTO challenge_days (challenge_id, day_number, date, day_name, status) VALUES " + placeholders,
    values
  );

  const challenge = await q(
    "SELECT id, user_id, title, description, total_days, start_date, reminder_time, status, created_at FROM challenges WHERE id = ?",
    [challengeId]
  );
  const days = await q(
    "SELECT id, challenge_id, day_number, date, day_name, status, completed_at FROM challenge_days WHERE challenge_id = ? ORDER BY date",
    [challengeId]
  );
  return sendSuccess(res, { challenge: challenge[0], days }, "Challenge created");
});

export const listChallenges = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const status = req.query.status || "active";

  const challenges = await q(
    "SELECT id, user_id, title, description, total_days, start_date, reminder_time, status, created_at FROM challenges WHERE user_id = ? AND status = ? ORDER BY created_at DESC",
    [userId, status]
  );

  const withProgress = await Promise.all(
    challenges.map(async (c) => {
      const counts = await q(
        "SELECT status, COUNT(*) as cnt FROM challenge_days WHERE challenge_id = ? GROUP BY status",
        [c.id]
      );
      const completed = counts.find((r) => r.status === "completed")?.cnt || 0;
      const missed = counts.find((r) => r.status === "missed")?.cnt || 0;
      const pending = counts.find((r) => r.status === "pending")?.cnt || 0;
      const progress = c.total_days ? Math.round((completed / c.total_days) * 100) : 0;
      return {
        ...c,
        completed_days: completed,
        missed_days: missed,
        pending_days: pending,
        progress_percent: progress,
      };
    })
  );

  return sendSuccess(res, withProgress);
});

export const getChallenge = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const { id } = req.params;

  const challenges = await q(
    "SELECT id, user_id, title, description, total_days, start_date, reminder_time, status, created_at FROM challenges WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  if (challenges.length === 0) return sendError(res, "Challenge not found", 404);

  const days = await q(
    "SELECT id, challenge_id, day_number, date, day_name, status, completed_at FROM challenge_days WHERE challenge_id = ? ORDER BY date",
    [id]
  );

  const c = challenges[0];
  const completed = days.filter((d) => d.status === "completed").length;
  const missed = days.filter((d) => d.status === "missed").length;
  const pending = days.filter((d) => d.status === "pending").length;
  const progress = c.total_days ? Math.round((completed / c.total_days) * 100) : 0;

  return sendSuccess(res, {
    challenge: c,
    days,
    completed_days: completed,
    missed_days: missed,
    pending_days: pending,
    progress_percent: progress,
  });
});

export const updateChallengeReminder = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const { id } = req.params;
  const { reminder_time } = req.body;

  const existing = await q("SELECT id FROM challenges WHERE id = ? AND user_id = ?", [id, userId]);
  if (existing.length === 0) return sendError(res, "Challenge not found", 404);

  await q("UPDATE challenges SET reminder_time = ? WHERE id = ? AND user_id = ?", [
    reminder_time || null,
    id,
    userId,
  ]);
  return sendSuccess(res, null, "Reminder time updated");
});

export const markDayComplete = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const { dayId } = req.params;

  const day = await q(
    "SELECT cd.id, cd.challenge_id, cd.date, cd.status, c.user_id FROM challenge_days cd JOIN challenges c ON c.id = cd.challenge_id WHERE cd.id = ?",
    [dayId]
  );
  if (day.length === 0) return sendError(res, "Day not found", 404);
  if (day[0].user_id !== userId) return sendError(res, "Forbidden", 403);
  if (day[0].status === "completed") return sendSuccess(res, null, "Already completed");

  await q(
    "UPDATE challenge_days SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
    [dayId]
  );

  const challengeId = day[0].challenge_id;
  const counts = await q(
    "SELECT COUNT(*) as total FROM challenge_days WHERE challenge_id = ?",
    [challengeId]
  );
  const completedCount = await q(
    "SELECT COUNT(*) as cnt FROM challenge_days WHERE challenge_id = ? AND status = 'completed'",
    [challengeId]
  );
  const total = counts[0].total;
  const completed = completedCount[0].cnt;
  if (total && completed >= total) {
    await q("UPDATE challenges SET status = 'completed' WHERE id = ?", [challengeId]);
  }

  return sendSuccess(res, null, "Day marked complete");
});

export const getDashboard = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;

  const activeChallengesRaw = await q(
    "SELECT id, title, total_days, start_date, reminder_time FROM challenges WHERE user_id = ? AND status = 'active' ORDER BY start_date DESC",
    [userId]
  );

  const activeChallenges = await Promise.all(
    activeChallengesRaw.map(async (ch) => {
      const counts = await q(
        "SELECT status, COUNT(*) as cnt FROM challenge_days WHERE challenge_id = ? GROUP BY status",
        [ch.id]
      );
      const completed = counts.find((r) => r.status === "completed")?.cnt || 0;
      const progressPercent = ch.total_days ? Math.round((completed / ch.total_days) * 100) : 0;
      return { ...ch, completed_days: completed, progress_percent: progressPercent };
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  let todayTodos = [];
  for (const ch of activeChallenges) {
    const rows = await q(
      "SELECT id, day_number, date, day_name, status FROM challenge_days WHERE challenge_id = ? AND date = ?",
      [ch.id, today]
    );
    if (rows.length > 0) {
      todayTodos.push({ challenge_id: ch.id, challenge_title: ch.title, day: rows[0] });
    }
  }

  const overall = await q(
    `SELECT 
      COUNT(DISTINCT c.id) as active_challenges,
      (SELECT COUNT(*) FROM challenge_days cd JOIN challenges c2 ON c2.id = cd.challenge_id WHERE c2.user_id = ? AND cd.status = 'completed') as total_completed_days,
      (SELECT COUNT(*) FROM challenge_days cd JOIN challenges c2 ON c2.id = cd.challenge_id WHERE c2.user_id = ? AND cd.status = 'missed') as total_missed_days
    FROM challenges c WHERE c.user_id = ? AND c.status = 'active'`,
    [userId, userId, userId]
  );

  const missedTasks = await q(
    `SELECT cd.id, cd.challenge_id, cd.date, cd.day_name, c.title as challenge_title
     FROM challenge_days cd JOIN challenges c ON c.id = cd.challenge_id
     WHERE c.user_id = ? AND cd.status = 'missed' ORDER BY cd.date DESC LIMIT 20`,
    [userId]
  );

  const user = await q(
    "SELECT id, name, email FROM challenge_users WHERE id = ?",
    [userId]
  );

  let investment_summary = { total_invested: 0, total_earnings: 0, upcoming_maturity: [], withdrawable_balance: 0 };
  try {
    const [invTotal] = await q("SELECT COALESCE(SUM(amount), 0) AS total FROM investments WHERE user_id = ?", [userId]);
    const withdrawals = await q("SELECT COALESCE(SUM(w.interest_earned), 0) AS earned FROM withdrawals w INNER JOIN investments i ON w.investment_id = i.id WHERE i.user_id = ?", [userId]);
    const upcoming = await q("SELECT id, amount, maturity_date FROM investments WHERE user_id = ? AND status = 'ACTIVE' ORDER BY maturity_date ASC LIMIT 3", [userId]);
    const activeRows = await q("SELECT i.amount, i.interest_percentage, i.lockin_days, i.start_date FROM investments i WHERE i.user_id = ? AND i.status = 'ACTIVE'", [userId]);
    let withdrawable = 0;
    const now = new Date();
    for (const r of activeRows) {
      const start = new Date(r.start_date);
      const daysHeld = Math.floor((now - start) / (24 * 60 * 60 * 1000));
      const principal = Number(r.amount);
      const interest = daysHeld >= r.lockin_days ? principal * (Number(r.interest_percentage) / 100) : 0;
      withdrawable += principal + interest;
    }
    investment_summary = {
      total_invested: Number(invTotal?.total) || 0,
      total_earnings: Number(withdrawals[0]?.earned) || 0,
      upcoming_maturity: upcoming,
      withdrawable_balance: withdrawable,
    };
  } catch (_) {
    // investment tables may not exist
  }

  let kyc_status = null;
  try {
    const kycRows = await q("SELECT status FROM investment_kyc WHERE user_id = ?", [userId]);
    if (kycRows.length > 0) kyc_status = kycRows[0].status;
  } catch (_) {
    // investment_kyc may not exist
  }

  return sendSuccess(res, {
    user: user[0],
    active_challenges: activeChallenges,
    today_todos: todayTodos,
    overall: overall[0],
    missed_tasks: missedTasks,
    investment_summary: investment_summary,
    kyc_status: kyc_status,
  });
});

export const getReports = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const { filter } = req.query; // daily | weekly | monthly | custom

  const challenges = await q(
    "SELECT id, title, total_days, start_date, status FROM challenges WHERE user_id = ? ORDER BY start_date DESC",
    [userId]
  );

  const report = {
    total_active: challenges.filter((c) => c.status === "active").length,
    total_completed: challenges.filter((c) => c.status === "completed").length,
    challenges: [],
    streak: { current: 0, longest: 0 },
  };

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (const c of challenges) {
    const days = await q(
      "SELECT date, status FROM challenge_days WHERE challenge_id = ? ORDER BY date",
      [c.id]
    );
    const completed = days.filter((d) => d.status === "completed").length;
    const missed = days.filter((d) => d.status === "missed").length;
    const pending = days.filter((d) => d.status === "pending").length;
    const completionPercent = c.total_days ? Math.round((completed / c.total_days) * 100) : 0;

    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].status === "completed") {
        runningStreak++;
      } else {
        if (runningStreak > longestStreak) longestStreak = runningStreak;
        runningStreak = 0;
      }
    }
    if (runningStreak > longestStreak) longestStreak = runningStreak;
    runningStreak = 0;

    report.challenges.push({
      id: c.id,
      title: c.title,
      total_days: c.total_days,
      completed_days: completed,
      missed_days: missed,
      pending_days: pending,
      completion_percent: completionPercent,
      success: completionPercent === 100,
    });
  }

  report.streak.longest = longestStreak;
  report.streak.current = currentStreak;
  report.challenge_success_rate =
    report.challenges.length > 0
      ? Math.round(
          (report.challenges.filter((ch) => ch.success).length / report.challenges.length) * 100
        )
      : 0;

  return sendSuccess(res, report);
});

// Admin: list challenge users (id, name, email) for dropdown
export const listUsersAdmin = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const rows = await q(
    "SELECT id, name, email FROM challenge_users ORDER BY name ASC"
  );
  return sendSuccess(res, { users: rows });
});

// Admin: get challenge reports for a specific user (user_id in query)
export const getReportsAdmin = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.query.user_id;
  if (!userId) return sendError(res, "user_id is required", 400);

  const challenges = await q(
    "SELECT id, title, total_days, start_date, status FROM challenges WHERE user_id = ? ORDER BY start_date DESC",
    [userId]
  );

  const report = {
    total_active: challenges.filter((c) => c.status === "active").length,
    total_completed: challenges.filter((c) => c.status === "completed").length,
    challenges: [],
    streak: { current: 0, longest: 0 },
  };

  let longestStreak = 0;
  let runningStreak = 0;

  for (const c of challenges) {
    const days = await q(
      "SELECT date, status FROM challenge_days WHERE challenge_id = ? ORDER BY date",
      [c.id]
    );
    const completed = days.filter((d) => d.status === "completed").length;
    const missed = days.filter((d) => d.status === "missed").length;
    const pending = days.filter((d) => d.status === "pending").length;
    const completionPercent = c.total_days ? Math.round((completed / c.total_days) * 100) : 0;

    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].status === "completed") {
        runningStreak++;
      } else {
        if (runningStreak > longestStreak) longestStreak = runningStreak;
        runningStreak = 0;
      }
    }
    if (runningStreak > longestStreak) longestStreak = runningStreak;
    runningStreak = 0;

    report.challenges.push({
      id: c.id,
      title: c.title,
      total_days: c.total_days,
      completed_days: completed,
      missed_days: missed,
      pending_days: pending,
      completion_percent: completionPercent,
      success: completionPercent === 100,
    });
  }

  report.streak.longest = longestStreak;
  report.challenge_success_rate =
    report.challenges.length > 0
      ? Math.round(
          (report.challenges.filter((ch) => ch.success).length / report.challenges.length) * 100
        )
      : 0;

  return sendSuccess(res, report);
});

export const getSettings = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const rows = await q(
    "SELECT reminder_enabled, eod_reminder_enabled, missed_alert_enabled, timezone FROM challenge_user_settings WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) {
    await q("INSERT INTO challenge_user_settings (user_id) VALUES (?)", [userId]);
    return sendSuccess(res, {
      reminder_enabled: true,
      eod_reminder_enabled: true,
      missed_alert_enabled: true,
      timezone: "UTC",
    });
  }
  return sendSuccess(res, rows[0]);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  const {
    reminder_enabled = true,
    eod_reminder_enabled = true,
    missed_alert_enabled = true,
    timezone = "UTC",
  } = req.body;

  const r = reminder_enabled ? 1 : 0;
  const e = eod_reminder_enabled ? 1 : 0;
  const m = missed_alert_enabled ? 1 : 0;
  const t = timezone || "UTC";

  await q(
    `INSERT INTO challenge_user_settings (user_id, reminder_enabled, eod_reminder_enabled, missed_alert_enabled, timezone)
     VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
     reminder_enabled = VALUES(reminder_enabled),
     eod_reminder_enabled = VALUES(eod_reminder_enabled),
     missed_alert_enabled = VALUES(missed_alert_enabled),
     timezone = VALUES(timezone)`,
    [userId, r, e, m, t]
  );
  return sendSuccess(res, null, "Settings updated");
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const q = getTenantQuery(req);
  const userId = req.challengeUserId;
  await q("DELETE FROM challenge_users WHERE id = ?", [userId]);
  return sendSuccess(res, null, "Account deleted");
});
