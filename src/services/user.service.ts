import { UserModel, type UserDoc } from "../models/user.js";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: UserDoc): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function findUserById(id: string): Promise<UserDoc | null> {
  return UserModel.findById(id);
}