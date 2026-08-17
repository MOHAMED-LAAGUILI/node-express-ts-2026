import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError, HttpStatus } from "../utils/AppError.js";

export function validateBody(schema: ZodType<unknown>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(HttpStatus.UNPROCESSABLE_ENTITY, "Validation failed", {
          details: result.error.flatten(),
        }),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}