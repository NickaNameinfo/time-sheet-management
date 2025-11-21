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
    req.tlName = decoded.tlName;
    req.hrName = decoded.hrName;
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

