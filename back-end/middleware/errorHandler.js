// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      Status: "Error",
      Error: "Duplicate entry. This record already exists.",
    });
  }

  if (err.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      Status: "Error",
      Error: "Database table not found. Please contact administrator.",
    });
  }

  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      Status: "Error",
      Error: "Database connection failed. Please try again later.",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      Status: "Error",
      Error: err.message || "Validation error",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      Status: "Error",
      Error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      Status: "Error",
      Error: "Token expired",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message;

  res.status(statusCode).json({
    Status: "Error",
    Error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

