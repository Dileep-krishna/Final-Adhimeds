import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketServer } from "socket.io";

import router from "./router.js";
import appRouter from "./app/AppRoutes/AppRouter.js";
import connection from "./connection.js";
import Role from "./model/Role.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/imgUploads", express.static(path.join(__dirname, "imgUploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-store-room", (storeId) => {
    if (storeId) {
      socket.join(`store-${storeId}`);
      console.log(`Socket ${socket.id} joined room: store-${storeId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use("/api", router);
app.use("/api/app", appRouter);

await connection();

const seedRoles = async () => {
  const roles = [];

  for (const name of roles) {
    const exists = await Role.findOne({ name });

    if (!exists) {
      await Role.create({ name });
      console.log(`Created role: ${name}`);
    }
  }
};

await seedRoles();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origin: ${CLIENT_URL}`);
  console.log(
    `Health check: http://localhost:${PORT}/health (or / on your deployed URL)`
  );
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");

  server.close(() => {
    console.log("Server closed gracefully");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});