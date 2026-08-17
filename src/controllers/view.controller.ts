import type { Request, Response } from "express";

export function renderHome(_req: Request, res: Response): void {
  res.render("index", {
    title: "Express + TypeScript 2026",
    year: new Date().getFullYear(),
  });
}