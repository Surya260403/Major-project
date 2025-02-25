class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  // Set default error message and status code
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error.";

  // Handle invalid JWT
  if (err.name === "JsonWebTokenError") {
    message = "Json web token is invalid, try again.";
    statusCode = 400;
  }

  // Handle expired JWT
  if (err.name === "TokenExpiredError") {
    message = "Json web token is expired, try again.";
    statusCode = 400;
  }

  // Handle Mongoose cast errors (invalid IDs, etc.)
  if (err.name === "CastError") {
    message = `Invalid value for field: ${err.path}`;
    statusCode = 400;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((error) => error.message).join(". ");
    statusCode = 400;
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    message = `Duplicate field value entered: ${Object.keys(err.keyValue)}`;
    statusCode = 400;
  }

  // Send final response
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export default ErrorHandler;
