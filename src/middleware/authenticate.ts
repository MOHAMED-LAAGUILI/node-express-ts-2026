import type { RequestHandler } from "express";
import { verifyJwt } from "../services/token.service.js";
import { findUserById, toSafeUser } from "../services/user.service.js";
import { AppError, HttpStatus } from "../utils/AppError.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Missing or malformed Authorization header");
  }
  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "User no longer exists");
  }

  req.user = toSafeUser(user);
  next();
};