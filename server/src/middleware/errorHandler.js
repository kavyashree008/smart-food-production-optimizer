import { ZodError } from "zod";

/**
 * Centralized application error handling middleware
 */
export function errorHandler(error, req, res, next) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((item) => ({
      field: item.path.join("."),
      message: item.message
    }));

    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: formattedErrors
    });
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `An entry with this ${field} already exists.`
    });
  }

  // Handle JWT token errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token"
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired. Please log in again."
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
}
