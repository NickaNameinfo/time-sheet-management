import rateLimit from "express-rate-limit";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== "production";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More lenient in development
  message: {
    Status: "Error",
    Error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 minutes in development, 15 minutes in production
  max: isDevelopment ? 100 : 5, // Very lenient in development (100 attempts), strict in production (5 attempts)
  message: {
    Status: "Error",
    Error: isDevelopment 
      ? "Too many login attempts. In development mode, you can restart the server to reset the limit, or wait 5 minutes."
      : "Too many login attempts, please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful requests - only failed attempts count
  standardHeaders: true,
  legacyHeaders: false,
  // In development, allow bypass via environment variable or if rate limit is disabled
  skip: (req) => {
    if (isDevelopment) {
      // Allow bypass if DISABLE_RATE_LIMIT is set to 'true'
      if (process.env.DISABLE_RATE_LIMIT === 'true') {
        console.log('Rate limiting bypassed for:', req.path);
        return true;
      }
    }
    return false;
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 upload requests per windowMs
  message: {
    Status: "Error",
    Error: "Too many upload requests, please try again later.",
  },
});

