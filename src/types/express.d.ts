import type { SafeUser } from "../services/user.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};