import jwt from "jsonwebtoken";
import config from "../config/index.js";

export const verifyUser = (req, res, next) => {
  // Check for token in body, cookies, or Authorization header
  const token =
    req.body?.tokensss ||
    req.cookies?.token ||
    req.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ 
      Status: "Error", 
      Error: "You are not authenticated. Token is required." 
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userName = decoded.userName;
    req.id = decoded.id;
    req.role = decoded.role;
    req.employeeName = decoded.employeeName;
    req.employeeId = decoded.employeeId;
    req.designation = decoded.designation;
    req.dateOfJoining = decoded.dateOfJoining;
    req.discipline = decoded.discipline;
    req.employeeStatus = decoded.employeeStatus;
    req.company_id = decoded.company_id;
    req.company_user_id = decoded.company_user_id;
    req.company_role = decoded.company_role;
    req.company_menu_role = decoded.company_menu_role;
    // Treat as company user if token has company_id or company_user_id (so tenant DB is always used for company logins)
    req.isCompanyUser = !!(decoded.isCompanyUser || decoded.company_id != null || (decoded.company_user_id != null && decoded.company_user_id !== ""));
    next();
  } catch (err) {
    return res.status(401).json({ 
      Status: "Error", 
      Error: "Invalid or expired token" 
    });
  }
};

export const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({ 
        Status: "Error", 
        Error: "Authentication required" 
      });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({ 
        Status: "Error", 
        Error: "Insufficient permissions" 
      });
    }

    next();
  };
};

/** Block company (tenant) logins – only super admin (main platform) admins may proceed. Use for platform-only APIs (e.g. admin investment KYC). */
export const requireSuperAdmin = (req, res, next) => {
  if (req.isCompanyUser === true || (req.company_id != null && req.company_id !== "") || (req.company_user_id != null && req.company_user_id !== "")) {
    return res.status(403).json({
      Status: "Error",
      Error: "This action is only available to platform administrators, not company accounts.",
    });
  }
  next();
};

