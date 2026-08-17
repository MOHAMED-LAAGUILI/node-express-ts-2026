import { Router } from "express";
import {
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/signup", validateBody(signUpSchema), signUp);
authRouter.post("/signin", validateBody(signInSchema), signIn);
authRouter.post(
  "/request-password-reset",
  validateBody(requestPasswordResetSchema),
  requestPasswordReset,
);
authRouter.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);