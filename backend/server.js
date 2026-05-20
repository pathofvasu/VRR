const http = require("http");

const app = require("./app");
const { APP_NAME, DEFAULT_PORT, NODE_ENV } = require("./config/constants");

const port = Number(process.env.PORT) || DEFAULT_PORT;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`${APP_NAME} backend listening on port ${port} in ${NODE_ENV} mode`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down ${APP_NAME} backend...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing the server:", error);
      process.exit(1);
    }

    console.log("HTTP server closed successfully.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
