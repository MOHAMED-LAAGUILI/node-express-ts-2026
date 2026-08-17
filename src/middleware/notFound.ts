import type { NextFunction, Request, Response } from "express";
import { AppError, HttpStatus } from "../utils/AppError.js";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(HttpStatus.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`));
}