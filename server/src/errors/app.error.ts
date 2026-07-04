class HttpAppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode || 500; // Default to 500 if no status code is provided
    this.isOperational = true; // Distinguish between operational errors and programming errors
  }
}

export default HttpAppError;
