import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: string;
}

export function signJwt(userId: string, role: string): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyJwt(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub: payload.sub, role: payload.role };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}