import { env } from "../config/env.js";
import { PasswordResetTokenModel } from "../models/passwordResetToken.js";
import { UserModel } from "../models/user.js";
import { AppError, HttpStatus } from "../utils/AppError.js";
import { generateResetToken, hashToken, signJwt } from "./token.service.js";
import { toSafeUser, type SafeUser } from "./user.service.js";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export const authService = {
  async signUp(input: SignUpInput): Promise<{ user: SafeUser; token: string }> {
    const existing = await UserModel.findOne({ email: input.email });
    if (existing) {
      throw new AppError(HttpStatus.CONFLICT, "An account with this email already exists");
    }
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      password: input.password,
    });
    return { user: toSafeUser(user), token: signJwt(user.id, user.role) };
  },

  async signIn(input: SignInInput): Promise<{ user: SafeUser; token: string }> {
    const user = await UserModel.findOne({ email: input.email }).select("+password");
    if (!user || !(await user.comparePassword(input.password))) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
    return { user: toSafeUser(user), token: signJwt(user.id, user.role) };
  },

  async requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {};
    }
    await PasswordResetTokenModel.deleteMany({ userId: user._id });
    const { raw, hash } = generateResetToken();
    await PasswordResetTokenModel.create({
      userId: user._id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000),
    });
    return { resetToken: raw };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await PasswordResetTokenModel.findOne({ tokenHash: hashToken(token) });
    if (!resetRecord || resetRecord.expiresAt.getTime() < Date.now()) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Reset token is invalid or expired");
    }
    const user = await UserModel.findById(resetRecord.userId);
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Reset token is invalid or expired");
    }
    user.password = newPassword;
    await user.save();
    await PasswordResetTokenModel.deleteMany({ userId: user._id });
  },
};