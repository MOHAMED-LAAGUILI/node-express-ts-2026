import type { Request, Response } from "express";
import { taskService } from "../services/task.service.js";
import { HttpStatus } from "../utils/AppError.js";

type TaskParams = { id: string };

export async function getTasks(req: Request, res: Response): Promise<void> {
  const tasks = await taskService.findAll(req.user!.id);
  res.json({ data: tasks });
}

export async function getTask(req: Request<TaskParams>, res: Response): Promise<void> {
  const task = await taskService.findById(req.params.id, req.user!.id);
  res.json({ data: task });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.create(req.user!.id, req.body);
  res.status(HttpStatus.CREATED).json({ data: task });
}

export async function updateTask(req: Request<TaskParams>, res: Response): Promise<void> {
  const task = await taskService.update(req.params.id, req.user!.id, req.body);
  res.json({ data: task });
}

export async function deleteTask(req: Request<TaskParams>, res: Response): Promise<void> {
  await taskService.remove(req.params.id, req.user!.id);
  res.status(HttpStatus.NO_CONTENT).send();
}