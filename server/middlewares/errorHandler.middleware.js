import HttpAppError from "../errors/app.error.js";

function errorHandler(err, req, res, next) {
  console.error("Unexpected error:", err);
  if (err instanceof HttpAppError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default errorHandler;
