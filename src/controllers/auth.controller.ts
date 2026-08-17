import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { HttpStatus } from "../utils/AppError.js";

export async function signUp(req: Request, res: Response): Promise<void> {
  const { user, token } = await authService.signUp(req.body);
  res.status(HttpStatus.CREATED).json({ success: true, data: { user, token } });
}

export async function signIn(req: Request, res: Response): Promise<void> {
  const { user, token } = await authService.signIn(req.body);
  res.json({ success: true, data: { user, token } });
}

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { resetToken } = await authService.requestPasswordReset(req.body.email);
  res.json({
    success: true,
    data: resetToken
      ? { resetToken, note: "Development mode: deliver this token via email in production." }
      : {},
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, message: "Password has been reset. You can now sign in." });
}