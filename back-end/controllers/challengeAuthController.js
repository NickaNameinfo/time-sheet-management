import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getTenantQuery, query } from "../config/database.js";
import config from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendEmail } from "../utils/emailService.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// In-memory OTP store: email -> { otp, expiresAt }. Clear on verify.
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const otpStore = new Map();
// Reset-password OTP: email -> { otp, expiresAt }
const resetOtpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const emailTrim = String(email || "").trim().toLowerCase();
  if (!emailTrim || !emailTrim.includes("@")) {
    return sendError(res, "Valid email is required", 400);
  }

  const emailCheck = await query("SELECT id FROM challenge_users WHERE email = ?", [emailTrim]);
  if (emailCheck.length > 0) {
    return sendError(res, "Email already registered", 409);
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  otpStore.set(emailTrim, { otp, expiresAt });

  try {
    await sendEmail({
      to: emailTrim,
      subject: "Your verification code – My Self",
      text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes. Do not share this code.`,
      html: `<p>Your OTP for registration is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes. Do not share this code.</p>`,
    });
  } catch (err) {
    otpStore.delete(emailTrim);
    console.error("[sendOtp] Email send failed:", err.message || err);
    const message =
      process.env.NODE_ENV === "development" && err.message
        ? `Email send failed: ${err.message}`
        : "Failed to send verification email. Please try again.";
    return sendError(res, message, 500);
  }

  return sendSuccess(res, { message: "OTP sent to your email" }, "OTP sent");
});

function verifyOtp(emailTrim, otp) {
  const entry = otpStore.get(emailTrim);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(emailTrim);
    return false;
  }
  if (String(otp).trim() !== entry.otp) return false;
  otpStore.delete(emailTrim);
  return true;
}

export const register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, otp, age, gender, location, address, referrer_email } = req.body;

  if (!name || !phone || !email || !password) {
    return sendError(res, "Name, phone, email and password are required", 400);
  }

  const emailTrim = String(email).trim().toLowerCase();
  const otpTrim = String(otp || "").trim();
  if (!otpTrim) {
    return sendError(res, "OTP is required. Please request OTP and enter the code sent to your email.", 400);
  }
  if (!verifyOtp(emailTrim, otpTrim)) {
    return sendError(res, "Invalid or expired OTP. Please request a new code.", 400);
  }

  const phoneTrim = String(phone).trim();
  const phoneCheck = await query("SELECT id FROM challenge_users WHERE phone = ?", [phoneTrim]);
  if (phoneCheck.length > 0) {
    return sendError(res, "Phone number already registered", 409);
  }
  const emailCheck = await query("SELECT id FROM challenge_users WHERE email = ?", [emailTrim]);
  if (emailCheck.length > 0) {
    return sendError(res, "Email already registered", 409);
  }

  let referredByUserId = null;
  const referrerEmailTrim = referrer_email ? String(referrer_email).trim().toLowerCase() : "";
  if (referrerEmailTrim && referrerEmailTrim !== emailTrim) {
    try {
      const referrerRows = await query("SELECT id FROM challenge_users WHERE email = ?", [referrerEmailTrim]);
      if (referrerRows.length > 0) referredByUserId = referrerRows[0].id;
    } catch (_) { /* referred_by column or table */ }
  }

  const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
  let result;
  if (referredByUserId != null) {
    try {
      result = await query(
        "INSERT INTO challenge_users (name, phone, email, password, age, gender, location, address, referred_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [String(name).trim(), phoneTrim, emailTrim, hashedPassword, age ? parseInt(age, 10) : null, gender && ["Male", "Female", "Other"].includes(gender) ? gender : null, location ? String(location).trim() : null, address ? String(address).trim() : null, referredByUserId]
      );
    } catch (err) {
      result = await query(
        "INSERT INTO challenge_users (name, phone, email, password, age, gender, location, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [String(name).trim(), phoneTrim, emailTrim, hashedPassword, age ? parseInt(age, 10) : null, gender && ["Male", "Female", "Other"].includes(gender) ? gender : null, location ? String(location).trim() : null, address ? String(address).trim() : null]
      );
    }
  } else {
    result = await query(
      "INSERT INTO challenge_users (name, phone, email, password, age, gender, location, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [String(name).trim(), phoneTrim, emailTrim, hashedPassword, age ? parseInt(age, 10) : null, gender && ["Male", "Female", "Other"].includes(gender) ? gender : null, location ? String(location).trim() : null, address ? String(address).trim() : null]
    );
  }

  const userId = result.insertId;
  await query(
    "INSERT INTO challenge_user_settings (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",
    [userId]
  );

  const token = jwt.sign(
    { id: userId, type: "challenge_user", email: emailTrim },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const user = await query("SELECT id, name, phone, email, age, gender, location, address, created_at FROM challenge_users WHERE id = ?", [
    userId,
  ]);
  return sendSuccess(res, { token, user: user[0] }, "Registration successful");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  const emailTrim = String(email).trim().toLowerCase();
  const rows = await query(
    "SELECT id, name, phone, email, password, age, gender, location, address, created_at FROM challenge_users WHERE email = ?",
    [emailTrim]
  );
  if (rows.length === 0) {
    return sendError(res, "Invalid email or password", 401);
  }

  const user = rows[0];
  const valid = await bcrypt.compare(String(password).trim(), user.password);
  if (!valid) {
    return sendError(res, "Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user.id, type: "challenge_user", email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  delete user.password;
  return sendSuccess(res, { token, user }, "Login successful");
});

export const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, null, "Logged out");
});

/** Forgot password: send OTP to email (user must already be registered) */
export const sendResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const emailTrim = String(email || "").trim().toLowerCase();
  if (!emailTrim || !emailTrim.includes("@")) {
    return sendError(res, "Valid email is required", 400);
  }

  const emailCheck = await query("SELECT id FROM challenge_users WHERE email = ?", [emailTrim]);
  if (emailCheck.length === 0) {
    return sendError(res, "No account found with this email", 404);
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  resetOtpStore.set(emailTrim, { otp, expiresAt });

  try {
    await sendEmail({
      to: emailTrim,
      subject: "Reset your password – My Self",
      text: `Your code to reset password is: ${otp}. It is valid for 10 minutes. Do not share this code.`,
      html: `<p>Your code to reset password is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes. Do not share this code.</p>`,
    });
  } catch (err) {
    resetOtpStore.delete(emailTrim);
    console.error("[sendResetOtp] Email send failed:", err.message || err);
    const message =
      process.env.NODE_ENV === "development" && err.message
        ? `Email send failed: ${err.message}`
        : "Failed to send verification email. Please try again.";
    return sendError(res, message, 500);
  }

  return sendSuccess(res, { message: "Verification code sent to your email" }, "Code sent");
});

function verifyResetOtp(emailTrim, otp) {
  const entry = resetOtpStore.get(emailTrim);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    resetOtpStore.delete(emailTrim);
    return false;
  }
  if (String(otp).trim() !== entry.otp) return false;
  resetOtpStore.delete(emailTrim);
  return true;
}

/** Reset password: email + OTP + new password (no auth required) */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, new_password } = req.body;
  const emailTrim = String(email || "").trim().toLowerCase();
  const otpTrim = String(otp || "").trim();
  const newPass = String(new_password || "").trim();

  if (!emailTrim || !emailTrim.includes("@")) {
    return sendError(res, "Valid email is required", 400);
  }
  if (!otpTrim) {
    return sendError(res, "Verification code is required", 400);
  }
  if (!newPass || newPass.length < 6) {
    return sendError(res, "New password must be at least 6 characters", 400);
  }
  if (!verifyResetOtp(emailTrim, otpTrim)) {
    return sendError(res, "Invalid or expired code. Please request a new code.", 400);
  }

  const rows = await query("SELECT id FROM challenge_users WHERE email = ?", [emailTrim]);
  if (rows.length === 0) {
    return sendError(res, "Account not found", 404);
  }

  const hashedPassword = await bcrypt.hash(newPass, 10);
  await query("UPDATE challenge_users SET password = ? WHERE id = ?", [hashedPassword, rows[0].id]);

  return sendSuccess(res, { message: "Password updated. You can log in with your new password." }, "Password reset");
});

/** Change password: requires logged-in user, current_password + new_password */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { current_password, new_password } = req.body;
  const currentPass = String(current_password || "").trim();
  const newPass = String(new_password || "").trim();

  if (!currentPass || !newPass) {
    return sendError(res, "Current password and new password are required", 400);
  }
  if (newPass.length < 6) {
    return sendError(res, "New password must be at least 6 characters", 400);
  }

  const rows = await query("SELECT id, password FROM challenge_users WHERE id = ?", [userId]);
  if (rows.length === 0) {
    return sendError(res, "User not found", 404);
  }

  const valid = await bcrypt.compare(currentPass, rows[0].password);
  if (!valid) {
    return sendError(res, "Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPass, 10);
  await query("UPDATE challenge_users SET password = ? WHERE id = ?", [hashedPassword, userId]);

  return sendSuccess(res, null, "Password changed");
});

/**
 * Employee/HR/TeamLead SSO: accept employee JWT, find or create challenge_user by employee email, return challenge token.
 * So logged-in Time Sheet users can access My Self without logging in again.
 */
export const accessWithEmployee = asyncHandler(async (req, res) => {
  const qTenant = getTenantQuery(req);
  const employeeId = req.id ?? null;
  const loginKey = String(req.userName || "").trim().toLowerCase();

  let empRows = [];
  if (employeeId) {
    empRows = await qTenant(
      "SELECT id, employeeName, employeeEmail, userName FROM employee WHERE id = ? LIMIT 1",
      [employeeId]
    );
  } else if (loginKey) {
    // Company login tokens often do not carry employee id; resolve by email/username.
    empRows = await qTenant(
      "SELECT id, employeeName, employeeEmail, userName FROM employee WHERE LOWER(TRIM(employeeEmail)) = ? OR LOWER(TRIM(userName)) = ? LIMIT 1",
      [loginKey, loginKey]
    );
  }

  if (empRows.length === 0) {
    return sendError(res, "Employee not found for current session", 404);
  }

  const emp = empRows[0];
  const resolvedEmployeeId = emp.id || employeeId || 0;
  let email = (emp.employeeEmail || "").toString().trim().toLowerCase();
  if (!email) {
    const userName = (emp.userName || `emp-${resolvedEmployeeId}`).toString().trim();
    email = `${userName.replace(/[^a-z0-9._-]/gi, "_")}@employee.local`;
  }

  let challengeUser = await query(
    "SELECT id, name, phone, email, age, gender, location, address, created_at FROM challenge_users WHERE email = ?",
    [email]
  );

  if (challengeUser.length === 0) {
    const name = emp.employeeName || emp.userName || "User";
    const placeholderPhone = `emp-${resolvedEmployeeId || Date.now()}`;
    const hashedPassword = await bcrypt.hash(String(placeholderPhone + email).trim(), 10);
    const insertResult = await query(
      "INSERT INTO challenge_users (name, phone, email, password) VALUES (?, ?, ?, ?)",
      [name, placeholderPhone, email, hashedPassword]
    );
    const newId = Number(insertResult?.insertId || 0);
    if (!newId) {
      // Fallback: fetch by email if insertId isn't returned by driver/connection.
      const created = await query("SELECT id FROM challenge_users WHERE email = ? LIMIT 1", [email]);
      const fallbackId = Number(created?.[0]?.id || 0);
      if (!fallbackId) return sendError(res, "Failed to resolve My Self user after creation", 500);
      await query(
        "INSERT INTO challenge_user_settings (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",
        [fallbackId]
      );
      challengeUser = await query(
        "SELECT id, name, phone, email, age, gender, location, address, created_at FROM challenge_users WHERE id = ?",
        [fallbackId]
      );
    } else {
      await query(
        "INSERT INTO challenge_user_settings (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",
        [newId]
      );
      challengeUser = await query(
        "SELECT id, name, phone, email, age, gender, location, address, created_at FROM challenge_users WHERE id = ?",
        [newId]
      );
    }
  }

  const user = challengeUser[0];
  const token = jwt.sign(
    { id: user.id, type: "challenge_user", email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return sendSuccess(res, { token, user }, "Access granted");
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const rows = await query(
    "SELECT id, name, phone, email, age, gender, location, address, created_at FROM challenge_users WHERE id = ?",
    [userId]
  );
  if (rows.length === 0) return sendError(res, "User not found", 404);
  return sendSuccess(res, rows[0]);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const { name, age, gender, location, address } = req.body;
  const updates = [];
  const values = [];
  if (name !== undefined) {
    updates.push("name = ?");
    values.push(String(name).trim());
  }
  if (age !== undefined) {
    updates.push("age = ?");
    values.push(age ? parseInt(age, 10) : null);
  }
  if (gender !== undefined) {
    updates.push("gender = ?");
    values.push(["Male", "Female", "Other"].includes(gender) ? gender : null);
  }
  if (location !== undefined) {
    updates.push("location = ?");
    values.push(String(location).trim() || null);
  }
  if (address !== undefined) {
    updates.push("address = ?");
    values.push(String(address).trim() || null);
  }
  if (updates.length === 0) return sendSuccess(res, null, "Nothing to update");
  values.push(userId);
  await query(
    `UPDATE challenge_users SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return sendSuccess(res, null, "Profile updated");
});
