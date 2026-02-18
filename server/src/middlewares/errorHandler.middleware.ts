import { Request, Response, NextFunction } from "express";
import HttpAppError from "../errors/app.error.ts";

function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error("Unexpected error:", err);
  if (err instanceof HttpAppError) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export default errorHandler;
