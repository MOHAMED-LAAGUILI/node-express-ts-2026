import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export default async function setup() {
  const mongod = await MongoMemoryServer.create({
    binary: { version: "6.0.16" },
    instance: { dbName: "express-ts-test" },
  });
  const uri = mongod.getUri("express-ts-test");

  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-secret-".padEnd(48, "x");
  process.env.CORS_ORIGIN = "*";

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });

  return async () => {
    await mongoose.disconnect();
    await mongod.stop();
  };
}