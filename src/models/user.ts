import bcrypt from "bcryptjs";
import { model, Schema, type HydratedDocument, type Model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, Model<IUser, {}, IUserMethods>, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  {
    timestamps: true,
    methods: {
      comparePassword(candidate: string): Promise<boolean> {
        return bcrypt.compare(candidate, this.password);
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

export const UserModel = model<IUser, Model<IUser, {}, IUserMethods>>("User", userSchema);