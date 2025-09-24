import { body, validationResult } from "express-validator";

// Common signup/login validation rules
export const signupValidation = [

  body("email")
    .isEmail().withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

];

export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Middleware to check validation result
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
