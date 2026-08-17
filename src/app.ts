import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { authRouter } from "./routes/auth.routes.js";
import { indexRouter } from "./routes/index.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { userRouter } from "./routes/user.routes.js";

const VIEWS_DIR = path.join(import.meta.dirname, "..", "views");
const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public");

const corsOrigin =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

const createTaskLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many task creations, slow down." },
});

export function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", VIEWS_DIR);
  app.set("trust proxy", 1); // trust one reverse proxy hop for real client IPs

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(express.static(PUBLIC_DIR));

  app.use(generalLimiter);

  app.use("/", indexRouter);
  app.use("/auth", authRouter);
  app.use("/me", authenticate, userRouter);
  app.use("/tasks", authenticate, createTaskLimiter, taskRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}