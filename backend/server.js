const http = require("http");

const app = require("./app");
const env = require("./config/env");
const { connectToDatabase, disconnectDatabase } = require("./config/database");

const server = http.createServer(app);

const startServer = async () => {
  await connectToDatabase();

  server.listen(env.port, () => {
    console.log(`${env.appName} backend listening on port ${env.port} in ${env.nodeEnv} mode`);
  });
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down ${env.appName} backend...`);

  server.close(async (error) => {
    try {
      if (error) {
        console.error("Error while closing the server:", error);
        process.exit(1);
      }

      await disconnectDatabase();
      console.log("HTTP server closed successfully.");
      process.exit(0);
    } catch (shutdownError) {
      console.error("Error during shutdown:", shutdownError);
      process.exit(1);
    }
  });
};

startServer().catch((error) => {
  console.error("Failed to start the backend:", error.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
