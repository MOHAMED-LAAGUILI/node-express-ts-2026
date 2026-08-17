import { model, Schema, type HydratedDocument, type Types } from "mongoose";

export interface ITask {
  title: string;
  completed: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDoc = HydratedDocument<ITask>;

export interface TaskOutput {
  id: string;
  title: string;
  completed: boolean;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTaskInput = Pick<ITask, "title">;

export type UpdateTaskInput = Partial<Pick<ITask, "title" | "completed">>;

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

export function toTaskOutput(task: TaskDoc): TaskOutput {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    owner: task.owner.toString(),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export const TaskModel = model<ITask>("Task", taskSchema);