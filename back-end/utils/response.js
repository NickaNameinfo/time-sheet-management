// Standardized response helpers
export const sendSuccess = (res, data = null, message = "Success") => {
  const response = { Status: "Success" };
  if (message !== "Success") {
    response.Message = message;
  }
  if (data !== null) {
    response.Result = data;
  }
  return res.json(response);
};

export const sendError = (res, error, statusCode = 400) => {
  return res.status(statusCode).json({
    Status: "Error",
    Error: typeof error === "string" ? error : error.message || "An error occurred",
  });
};

