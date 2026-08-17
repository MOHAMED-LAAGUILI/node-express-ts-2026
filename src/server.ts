import { createApp } from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Express server running at http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  function shutdown(signal: string): void {
    console.log(`${signal} received, shutting down gracefully...`);
    const forceExit = setTimeout(() => {
      console.error("Forced exit: connections did not close in time.");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(() => {
      clearTimeout(forceExit);
      console.log("Server closed.");
      process.exit(0);
    });
  }

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown("uncaughtException");
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});