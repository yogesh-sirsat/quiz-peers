class HttpAppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500; // Default to 500 if no status code is provided
    this.isOperational = true; // Distinguish between operational errors and programming errors
  }
}

export default HttpAppError;
