import jwt from "jsonwebtoken";
import config from "../config/index.js";

export const verifyChallengeUser = (req, res, next) => {
  const token =
    req.body?.token ||
    req.query?.token ||
    req.headers?.authorization?.replace("Bearer ", "") ||
    req.cookies?.challenge_token;

  if (!token) {
    return res.status(401).json({
      Status: "Error",
      Error: "Authentication required. Token is missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== "challenge_user") {
      return res.status(401).json({
        Status: "Error",
        Error: "Invalid token type",
      });
    }
    req.challengeUserId = decoded.id;
    req.challengeUserEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({
      Status: "Error",
      Error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
};
