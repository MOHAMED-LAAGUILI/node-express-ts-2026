import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { PasswordResetTokenModel } from "../src/models/passwordResetToken.js";
import { TaskModel } from "../src/models/task.js";
import { UserModel } from "../src/models/user.js";

const app = createApp();

beforeEach(async () => {
  await Promise.all([
    TaskModel.deleteMany({}),
    UserModel.deleteMany({}),
    PasswordResetTokenModel.deleteMany({}),
  ]);
});

async function registerUser(
  name = "Jane",
  email = "jane@example.com",
  password = "password123",
) {
  const res = await request(app)
    .post("/auth/signup")
    .send({ name, email, password });
  expect(res.status).toBe(201);
  return res.body.data as { user: { id: string; email: string }; token: string };
}

describe("auth", () => {
  it("rejects unauthenticated access to protected routes", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
  });

  it("signs up a user and returns a token", async () => {
    const { user, token } = await registerUser();
    expect(user.email).toBe("jane@example.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("rejects duplicate signup with 409", async () => {
    await registerUser();
    const res = await request(app)
      .post("/auth/signup")
      .send({ name: "Jane", email: "jane@example.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("signs in with valid credentials", async () => {
    await registerUser();
    const res = await request(app)
      .post("/auth/signin")
      .send({ email: "jane@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("rejects wrong password with 401", async () => {
    await registerUser();
    const res = await request(app)
      .post("/auth/signin")
      .send({ email: "jane@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("exposes the current user at /me", async () => {
    const { token, user } = await registerUser();
    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.password).toBeUndefined();
  });
});

describe("tasks API", () => {
  it("rejects task creation without a token", async () => {
    const res = await request(app).post("/tasks").send({ title: "nope" });
    expect(res.status).toBe(401);
  });

  it("supports full CRUD for an authenticated user", async () => {
    const { token } = await registerUser();
    const created = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "First task" });
    expect(created.status).toBe(201);
    const taskId = created.body.data.id;

    const list = await request(app).get("/tasks").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const updated = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ completed: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data.completed).toBe(true);

    const deleted = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const after = await request(app)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(404);
  });

  it("isolates tasks per user", async () => {
    const alice = await registerUser("Alice", "alice@example.com", "password123");
    const bob = await registerUser("Bob", "bob@example.com", "password123");

    const created = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ title: "Alice's task" });
    const taskId = created.body.data.id;

    const bobView = await request(app)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${bob.token}`);
    expect(bobView.status).toBe(404);
  });
});

describe("password reset", () => {
  it("round-trips a reset token to set a new password", async () => {
    await registerUser();
    const resetRes = await request(app)
      .post("/auth/request-password-reset")
      .send({ email: "jane@example.com" });
    expect(resetRes.status).toBe(200);
    const resetToken = resetRes.body.data.resetToken;
    expect(typeof resetToken).toBe("string");

    const resetDone = await request(app)
      .post("/auth/reset-password")
      .send({ token: resetToken, password: "newpassword456" });
    expect(resetDone.status).toBe(200);

    const oldSignIn = await request(app)
      .post("/auth/signin")
      .send({ email: "jane@example.com", password: "password123" });
    expect(oldSignIn.status).toBe(401);

    const newSignIn = await request(app)
      .post("/auth/signin")
      .send({ email: "jane@example.com", password: "newpassword456" });
    expect(newSignIn.status).toBe(200);
  });

  it("does not leak whether an email exists", async () => {
    const res = await request(app)
      .post("/auth/request-password-reset")
      .send({ email: "ghost@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.data.resetToken).toBeUndefined();
  });
});