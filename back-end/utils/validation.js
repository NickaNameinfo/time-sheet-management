import { body, validationResult } from "express-validator";

// Standard validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      Status: "Error",
      Error: "Validation failed",
      Errors: errors.array(),
    });
  }
  next();
};

// Common validation rules
export const employeeValidation = [
  body("employeeName").notEmpty().withMessage("Employee name is required"),
  body("EMPID").notEmpty().withMessage("Employee ID is required"),
  body("employeeEmail").isEmail().withMessage("Valid email is required"),
  body("userName").notEmpty().withMessage("Username is required"),
  body("role").notEmpty().withMessage("Role is required"),
];

export const loginValidation = [
  body("userName").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const leaveValidation = [
  body("leaveType").notEmpty().withMessage("Leave type is required"),
  body("leaveFrom").notEmpty().withMessage("Leave from date is required"),
  body("employeeName").notEmpty().withMessage("Employee name is required"),
  body("employeeId").notEmpty().withMessage("Employee ID is required"),
];

