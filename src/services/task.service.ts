import {
  TaskModel,
  toTaskOutput,
  type CreateTaskInput,
  type TaskOutput,
  type UpdateTaskInput,
} from "../models/task.js";
import { AppError, HttpStatus } from "../utils/AppError.js";

export const taskService = {
  async findAll(ownerId: string): Promise<TaskOutput[]> {
    const tasks = await TaskModel.find({ owner: ownerId }).sort({ createdAt: -1 });
    return tasks.map(toTaskOutput);
  },

  async findById(id: string, ownerId: string): Promise<TaskOutput> {
    const task = await TaskModel.findOne({ _id: id, owner: ownerId });
    if (!task) {
      throw new AppError(HttpStatus.NOT_FOUND, `Task "${id}" not found`);
    }
    return toTaskOutput(task);
  },

  async create(ownerId: string, input: CreateTaskInput): Promise<TaskOutput> {
    const task = await TaskModel.create({ ...input, owner: ownerId });
    return toTaskOutput(task);
  },

  async update(id: string, ownerId: string, input: UpdateTaskInput): Promise<TaskOutput> {
    const task = await TaskModel.findOne({ _id: id, owner: ownerId });
    if (!task) {
      throw new AppError(HttpStatus.NOT_FOUND, `Task "${id}" not found`);
    }
    if (input.title !== undefined) {
      task.title = input.title;
    }
    if (input.completed !== undefined) {
      task.completed = input.completed;
    }
    await task.save();
    return toTaskOutput(task);
  },

  async remove(id: string, ownerId: string): Promise<void> {
    const result = await TaskModel.deleteOne({ _id: id, owner: ownerId });
    if (result.deletedCount === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, `Task "${id}" not found`);
    }
  },
};