import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT || 8081,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET_KEY || "jwt-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:5173", // Frontend React app
      "http://localhost:3000", // Alternative frontend port
    ],
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "public/images",
  },
};

