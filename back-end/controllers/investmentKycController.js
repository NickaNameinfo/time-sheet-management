import path from "path";
import fs from "fs";
import { query, companyQuery } from "../config/database.js";
import config from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { encrypt, decrypt, maskAadhaar, maskPan, maskAccount } from "../utils/encryption.js";

export const getKycStatus = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  let rows;
  try {
    rows = await query(
      "SELECT id, status, verified_at, submitted_at, bank_holder_name, bank_name, account_number_encrypted, ifsc_code, branch, address, aadhaar_encrypted, pan_encrypted, aadhaar_document_path, pan_document_path, document_verification_status FROM investment_kyc WHERE user_id = ?",
      [userId]
    );
  } catch (err) {
    if (err.code === "ER_BAD_FIELD_ERROR" && err.message?.includes("document_verification_status")) {
      rows = await query(
        "SELECT id, status, verified_at, submitted_at, bank_holder_name, bank_name, account_number_encrypted, ifsc_code, branch, address, aadhaar_encrypted, pan_encrypted, aadhaar_document_path, pan_document_path FROM investment_kyc WHERE user_id = ?",
        [userId]
      );
      if (rows.length > 0) rows[0].document_verification_status = "PENDING";
    } else throw err;
  }
  if (rows.length === 0) {
    return sendSuccess(res, { status: null, kyc: null }, "No KYC submitted");
  }
  const kyc = rows[0];
  const aadhaarPlain = decrypt(kyc.aadhaar_encrypted);
  const panPlain = decrypt(kyc.pan_encrypted);
  const accountPlain = decrypt(kyc.account_number_encrypted);
  return sendSuccess(res, {
    status: kyc.status,
    document_verification_status: kyc.document_verification_status || "PENDING",
    kyc: {
      id: kyc.id,
      bank_holder_name: kyc.bank_holder_name,
      bank_name: kyc.bank_name,
      account_number_masked: accountPlain ? maskAccount(accountPlain) : "****",
      ifsc_code: kyc.ifsc_code,
      branch: kyc.branch,
      address: kyc.address,
      aadhaar_masked: aadhaarPlain ? maskAadhaar(aadhaarPlain) : null,
      pan_masked: panPlain ? maskPan(panPlain) : null,
      verified_at: kyc.verified_at,
      submitted_at: kyc.submitted_at,
      has_aadhaar_document: !!kyc.aadhaar_document_path,
      has_pan_document: !!kyc.pan_document_path,
    },
  });
});

export const submitKyc = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const {
    bank_holder_name,
    bank_name,
    account_number,
    ifsc_code,
    branch,
    address,
    aadhaar_number,
    pan_number,
  } = req.body || {};

  if (
    !bank_holder_name ||
    !bank_name ||
    !ifsc_code ||
    !branch ||
    !address
  ) {
    return sendError(res, "Required: bank_holder_name, bank_name, ifsc_code, branch, address", 400);
  }

  const existing = await query(
    "SELECT id, status, account_number_encrypted, aadhaar_encrypted, pan_encrypted FROM investment_kyc WHERE user_id = ?",
    [userId]
  );
  if (existing.length > 0 && existing[0].status === "VERIFIED") {
    return sendError(res, "KYC already verified", 400);
  }

  const isUpdate = existing.length > 0;
  const accountProvided = account_number != null && String(account_number).trim() !== "";
  const aadhaarProvided = aadhaar_number != null && String(aadhaar_number).trim() !== "";
  const panProvided = pan_number != null && String(pan_number).trim() !== "";
  if (!isUpdate && !accountProvided) {
    return sendError(res, "For new KYC, account_number is required", 400);
  }
  if (!isUpdate && (!aadhaarProvided || !panProvided)) {
    return sendError(res, "For new KYC, aadhaar_number and pan_number are required", 400);
  }

  let accountEnc;
  let aadhaarEnc;
  let panEnc;
  if (isUpdate) {
    accountEnc = accountProvided ? encrypt(String(account_number).trim()) : existing[0].account_number_encrypted;
    aadhaarEnc = aadhaarProvided ? encrypt(String(aadhaar_number).trim().replace(/\s/g, "")) : existing[0].aadhaar_encrypted;
    panEnc = panProvided ? encrypt(String(pan_number).trim().toUpperCase()) : existing[0].pan_encrypted;
  } else {
    accountEnc = encrypt(String(account_number).trim());
    aadhaarEnc = encrypt(String(aadhaar_number).trim().replace(/\s/g, ""));
    panEnc = encrypt(String(pan_number).trim().toUpperCase());
  }

  const aadhaarFile = req.files?.aadhaar_document?.[0];
  const panFile = req.files?.pan_document?.[0];
  const aadhaarDocPath = aadhaarFile ? aadhaarFile.filename : null;
  const panDocPath = panFile ? panFile.filename : null;

  if (isUpdate) {
    await query(
      `UPDATE investment_kyc SET bank_holder_name=?, bank_name=?, account_number_encrypted=?, ifsc_code=?, branch=?, address=?, aadhaar_encrypted=?, pan_encrypted=?, aadhaar_document_path=COALESCE(?, aadhaar_document_path), pan_document_path=COALESCE(?, pan_document_path), status='PENDING_VERIFICATION', verified_at=NULL, submitted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE user_id = ?`,
      [
        String(bank_holder_name).trim(),
        String(bank_name).trim(),
        accountEnc,
        String(ifsc_code).trim().toUpperCase(),
        String(branch).trim(),
        String(address).trim(),
        aadhaarEnc,
        panEnc,
        aadhaarDocPath,
        panDocPath,
        userId,
      ]
    );
  } else {
    await query(
      `INSERT INTO investment_kyc (user_id, bank_holder_name, bank_name, account_number_encrypted, ifsc_code, branch, address, aadhaar_encrypted, pan_encrypted, aadhaar_document_path, pan_document_path, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'PENDING_VERIFICATION')`,
      [
        userId,
        String(bank_holder_name).trim(),
        String(bank_name).trim(),
        accountEnc,
        String(ifsc_code).trim().toUpperCase(),
        String(branch).trim(),
        String(address).trim(),
        aadhaarEnc,
        panEnc,
        aadhaarDocPath,
        panDocPath,
      ]
    );
  }

  await query(
    "INSERT INTO investment_audit_log (user_id, action, entity_type, details) VALUES (?, 'KYC_SUBMIT', 'kyc', ?)",
    [userId, JSON.stringify({ message: "KYC submitted" })]
  );

  await query(
    "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, "KYC Submitted", "Your Aadhaar & PAN will be verified within 24 hours."]
  );

  return sendSuccess(res, { status: "PENDING_VERIFICATION" }, "KYC submitted. Verification within 24 hours.");
});

// Upload/update only documents (Aadhaar & PAN). Allowed even when KYC is already VERIFIED.
export const uploadKycDocuments = asyncHandler(async (req, res) => {
  const userId = req.challengeUserId;
  const aadhaarFile = req.files?.aadhaar_document?.[0];
  const panFile = req.files?.pan_document?.[0];
  if (!aadhaarFile && !panFile) {
    return sendError(res, "At least one document (aadhaar_document or pan_document) is required", 400);
  }
  const existing = await query("SELECT id, status FROM investment_kyc WHERE user_id = ?", [userId]);
  if (existing.length === 0) {
    return sendError(res, "Submit KYC details first before uploading documents", 400);
  }
  const aadhaarDocPath = aadhaarFile ? aadhaarFile.filename : null;
  const panDocPath = panFile ? panFile.filename : null;
  await query(
    `UPDATE investment_kyc SET
       aadhaar_document_path = COALESCE(?, aadhaar_document_path),
       pan_document_path = COALESCE(?, pan_document_path),
       document_verification_status = 'PENDING',
       updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [aadhaarDocPath, panDocPath, userId]
  );
  return sendSuccess(res, { message: "Documents uploaded. Admin will verify." }, "Documents uploaded.");
});

// Admin: list all KYC records (for Update KYC status page) with full details and masked sensitive data.
// For company login: only KYC for challenge_users whose email matches the company's employees (company DB).
// For super admin: all KYC records (super admin DB).
export const listKycForAdmin = asyncHandler(async (req, res) => {
  const isCompanyUser = req.isCompanyUser === true || (req.company_id != null && req.company_id !== "") || (req.company_user_id != null && req.company_user_id !== "");
  let allowedEmails = null; // null = no filter (super admin); [] = empty list; [...] = filter by these emails
  if (isCompanyUser) {
    try {
      const empRows = await companyQuery(
        "SELECT employeeEmail FROM employee WHERE employeeEmail IS NOT NULL AND TRIM(COALESCE(employeeEmail, '')) != ''"
      );
      allowedEmails = (empRows || []).map((r) => (r.employeeEmail && String(r.employeeEmail).trim()) || null).filter(Boolean);
      if (allowedEmails.length === 0) {
        return sendSuccess(res, { list: [] });
      }
    } catch (err) {
      if (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_DB_ERROR") {
        return sendSuccess(res, { list: [] });
      }
      throw err;
    }
  }

  const emailFilter =
    allowedEmails != null && allowedEmails.length > 0
      ? ` AND u.email IN (${allowedEmails.map(() => "?").join(",")})`
      : "";
  const baseParams = allowedEmails != null && allowedEmails.length > 0 ? allowedEmails : [];

  let rows;
  try {
    rows = await query(
      `SELECT k.id, k.user_id, k.bank_holder_name, k.bank_name, k.ifsc_code, k.branch, k.address, k.status, k.verified_at, k.submitted_at, k.admin_note,
       k.account_number_encrypted, k.aadhaar_encrypted, k.pan_encrypted,
       k.aadhaar_document_path, k.pan_document_path, k.document_verification_status,
       u.name AS user_name, u.email
       FROM investment_kyc k
       JOIN challenge_users u ON u.id = k.user_id
       WHERE 1=1 ${emailFilter}
       ORDER BY k.submitted_at DESC`,
      baseParams
    );
  } catch (err) {
    if (err.code === "ER_BAD_FIELD_ERROR" && err.message?.includes("admin_note")) {
      const fallback = await query(
        `SELECT k.id, k.user_id, k.bank_holder_name, k.bank_name, k.ifsc_code, k.branch, k.address, k.status, k.verified_at, k.submitted_at,
         k.account_number_encrypted, k.aadhaar_encrypted, k.pan_encrypted,
         k.aadhaar_document_path, k.pan_document_path, k.document_verification_status,
         u.name AS user_name, u.email
         FROM investment_kyc k
         JOIN challenge_users u ON u.id = k.user_id
         WHERE 1=1 ${emailFilter}
         ORDER BY k.submitted_at DESC`,
        baseParams
      );
      rows = (Array.isArray(fallback) ? fallback : []).map((r) => ({ ...r, admin_note: null }));
    } else {
      throw err;
    }
  }
  const list = (Array.isArray(rows) ? rows : []).map((r) => {
    const out = { ...r };
    delete out.account_number_encrypted;
    delete out.aadhaar_encrypted;
    delete out.pan_encrypted;
    if (out.admin_note === undefined) out.admin_note = null;
    try {
      if (r.account_number_encrypted) out.account_number = decrypt(r.account_number_encrypted) || "";
      if (r.aadhaar_encrypted) out.aadhaar_number = decrypt(r.aadhaar_encrypted) || "";
      if (r.pan_encrypted) out.pan_number = decrypt(r.pan_encrypted) || "";
    } catch (_) {
      out.account_number = "";
      out.aadhaar_number = "";
      out.pan_number = "";
    }
    return out;
  });
  return sendSuccess(res, { list });
});

// Helper: for company login, ensure target user_id belongs to company (challenge_users.email in company employees).
const ensureCompanyCanAccessUser = async (req, userId) => {
  const isCompanyUser = req.isCompanyUser === true || (req.company_id != null && req.company_id !== "") || (req.company_user_id != null && req.company_user_id !== "");
  if (!isCompanyUser) return;
  let allowedEmails = new Set();
  try {
    const empRows = await companyQuery(
      "SELECT employeeEmail FROM employee WHERE employeeEmail IS NOT NULL AND TRIM(COALESCE(employeeEmail, '')) != ''"
    );
    allowedEmails = new Set((empRows || []).map((r) => (r.employeeEmail && String(r.employeeEmail).trim()) || null).filter(Boolean));
  } catch (e) {
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR") {
      allowedEmails = new Set();
    } else throw e;
  }
  const userRows = await query("SELECT email FROM challenge_users WHERE id = ?", [userId]);
  if (userRows.length === 0 || !allowedEmails.has((userRows[0].email && String(userRows[0].email).trim()) || "")) {
    const err = new Error("You can only update or view KYC for users in your company.");
    err.statusCode = 403;
    throw err;
  }
};

// Admin: update KYC status (PENDING_VERIFICATION | VERIFIED | REJECTED). REJECTED can include admin_note.
// Also supports document_verification_status (PENDING | VERIFIED) to mark uploaded documents as verified.
export const updateKycStatus = asyncHandler(async (req, res) => {
  const { user_id, status, admin_note, document_verification_status: docStatus } = req.body;
  if (!user_id) return sendError(res, "user_id required", 400);

  await ensureCompanyCanAccessUser(req, user_id);

  let noteVal = null;
  const updates = [];
  const params = [];

  if (status) {
    const allowed = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"];
    if (!allowed.includes(status)) return sendError(res, "status must be PENDING_VERIFICATION, VERIFIED, or REJECTED", 400);
    if (status === "REJECTED" && !(admin_note && String(admin_note).trim())) return sendError(res, "admin_note is required when status is REJECTED", 400);
    noteVal = status === "REJECTED" ? (String(admin_note).trim() || null) : null;
    try {
      if (status === "REJECTED") {
        updates.push("status = ?", "verified_at = NULL", "admin_note = ?");
        params.push(status, noteVal);
      } else {
        updates.push("status = ?", "verified_at = IF(? = 'VERIFIED', NOW(), NULL)");
        params.push(status, status);
      }
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR" && err.message?.includes("admin_note")) {
        return sendError(res, "Database migration required for 'Cancelled with note'. Run: back-end/database/alter_investment_kyc_rejected.sql", 400);
      }
      throw err;
    }
  }

  if (docStatus != null && docStatus !== "") {
    const docAllowed = ["PENDING", "VERIFIED"];
    if (!docAllowed.includes(docStatus)) return sendError(res, "document_verification_status must be PENDING or VERIFIED", 400);
    updates.push("document_verification_status = ?");
    params.push(docStatus);
  }

  if (updates.length === 0) return sendError(res, "Provide status and/or document_verification_status", 400);

  params.push(user_id);
  const result = await query(
    `UPDATE investment_kyc SET ${updates.join(", ")} WHERE user_id = ?`,
    params
  );
  if (result.affectedRows === 0) return sendError(res, "KYC record not found", 404);
  if (status === "VERIFIED") {
    await query(
      "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, 'Profile Verified', 'Your profile is verified. You can now start investing.')",
      [user_id]
    );
  }
  if (status === "REJECTED") {
    await query(
      "INSERT INTO investment_notifications (user_id, title, message) VALUES (?, 'KYC Update', ?)",
      [user_id, `Your KYC was not approved. Note: ${noteVal || "—"}`]
    );
  }
  return sendSuccess(res, { user_id, status, admin_note: noteVal || undefined }, "KYC status updated.");
});

// Admin: view KYC document (aadhaar or pan) for a user. Sends file for display/download.
export const getKycDocument = asyncHandler(async (req, res) => {
  const { userId, type } = req.params;
  if (!userId || !type) return sendError(res, "userId and type (aadhaar|pan) required", 400);
  const docType = type.toLowerCase();
  if (docType !== "aadhaar" && docType !== "pan") return sendError(res, "type must be aadhaar or pan", 400);
  const column = docType === "aadhaar" ? "aadhaar_document_path" : "pan_document_path";
  const rows = await query(`SELECT ${column} AS path FROM investment_kyc WHERE user_id = ?`, [userId]);
  if (rows.length === 0) return sendError(res, "KYC record not found", 404);

  await ensureCompanyCanAccessUser(req, userId);
  const filename = rows[0].path;
  if (!filename || typeof filename !== "string") return sendError(res, "Document not uploaded", 404);
  if (!filename.startsWith("kyc_") || filename.includes("..") || /[\/\\]/.test(filename)) {
    return sendError(res, "Invalid document path", 400);
  }
  const uploadDir = path.isAbsolute(config.upload.dir) ? config.upload.dir : path.join(process.cwd(), config.upload.dir);
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return sendError(res, "Document file not found", 404);
  res.sendFile(filePath, { maxAge: "1h" });
});
