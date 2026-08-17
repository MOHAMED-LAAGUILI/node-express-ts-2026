import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { validateBody } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema.js";

export const taskRouter = Router();

taskRouter.get("/", getTasks);
taskRouter.get("/:id", getTask);
taskRouter.post("/", validateBody(createTaskSchema), createTask);
taskRouter.patch("/:id", validateBody(updateTaskSchema), updateTask);
taskRouter.delete("/:id", deleteTask);