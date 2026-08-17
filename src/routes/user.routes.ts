import { Router } from "express";
import { getMe } from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.get("/me", getMe);