import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import config from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, uploadLimiter } from "./middleware/rateLimiter.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import teamLeadRoutes from "./routes/teamLeadRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
// Phase 1 & 2 Routes
import overtimeRoutes from "./routes/overtimeRoutes.js";
import leaveBalanceRoutes from "./routes/leaveBalanceRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import productivityRoutes from "./routes/productivityRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const allowedOrigins = config.cors.origin;
      
      // If origin is a string array, check if it matches
      if (Array.isArray(allowedOrigins)) {
        // Check if any origin matches (including regex patterns)
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return origin === allowed;
          } else if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
        
        if (isAllowed) {
          return callback(null, true);
        }
      }
      
      // For development: allow all localhost origins
      if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Default: allow if in config
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Logging middleware
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Apply rate limiting to all routes
app.use(apiLimiter);

// Routes
app.use("/", authRoutes);
app.use("/", employeeRoutes);
app.use("/", leaveRoutes);
app.use("/", projectRoutes);
app.use("/", teamLeadRoutes);
app.use("/", hrRoutes);
app.use("/", settingsRoutes);
app.use("/", notificationRoutes);
// Phase 1 & 2 Routes
app.use("/", overtimeRoutes);
app.use("/", leaveBalanceRoutes);
app.use("/", shiftRoutes);
app.use("/", payrollRoutes);
app.use("/", budgetRoutes);
app.use("/", billingRoutes);
app.use("/", productivityRoutes);
app.use("/", approvalRoutes);
app.use("/", reportRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ Status: "Success", Message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    Status: "Error",
    Error: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
