require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

let server;

console.log("Starting backend...");
console.log("PORT:", PORT);
console.log("MONGO_URI exists:", Boolean(MONGO_URI));

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected");

    server = http.createServer(app);

    // Prevent hanging requests forever
    server.setTimeout(15000);
    server.keepAliveTimeout = 5000;
    server.headersTimeout = 6000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Startup failed:");
    console.error(err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    await mongoose.connection.close(false);
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("Graceful shutdown failed:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

startServer();