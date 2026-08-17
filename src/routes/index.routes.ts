import { Router } from "express";
import { renderHome } from "../controllers/view.controller.js";

export const indexRouter = Router();

indexRouter.get("/", renderHome);

indexRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});