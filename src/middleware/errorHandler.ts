import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError, HttpStatus } from "../utils/AppError.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

interface MongoErrorLike {
  name?: string;
  code?: number;
  errors?: Record<string, { message?: unknown }>;
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error && typeof error === "object" && "name" in error) {
    const mongoError = error as MongoErrorLike;
    if (mongoError.name === "CastError") {
      return new AppError(HttpStatus.BAD_REQUEST, "Invalid id format");
    }
    if (mongoError.name === "ValidationError") {
      return new AppError(HttpStatus.BAD_REQUEST, "Validation error", {
        details: Object.values(mongoError.errors ?? {}).map((e) => e.message ?? "invalid value"),
      });
    }
    if (mongoError.name === "MongoServerError" && mongoError.code === 11000) {
      return new AppError(HttpStatus.CONFLICT, "A record with this value already exists");
    }
  }

  return new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", {
    isOperational: false,
  });
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);

  if (env.NODE_ENV === "development" || !appError.isOperational) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
    console.error(getErrorMessage(err));
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(appError.details !== undefined ? { details: appError.details } : {}),
  });
};