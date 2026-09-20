import dotenv from "dotenv";
dotenv.config(); // reads .env locally, harmless on Render

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketServer } from "socket.io";

import router from "./router.js";
import connection from "./connection.js";
import Role from "./model/Role.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Environment variables ----------
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ---------- Middlewares ----------
app.use(cors({ origin: CLIENT_URL })); // restrict to frontend origin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use("/imgUploads", express.static(path.join(__dirname, "imgUploads")));

// ---------- Health check endpoint (for Render / uptime monitoring) ----------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
// also add a simpler root route for convenience
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ---------- Socket.IO Setup ----------
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Make io available globally
app.set("io", io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ---------- Socket.IO connection handler ----------
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // ✅ NEW: Listen for store room joining
  socket.on("join-store-room", (storeId) => {
    if (storeId) {
      socket.join(`store-${storeId}`);
      console.log(`✅ Socket ${socket.id} joined room: store-${storeId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ---------- API routes ----------
app.use("/api", router);

// ---------- Database connection & seed ----------
await connection();

const seedRoles = async () => {
  const roles = []; // add role names like "admin", "user", etc. if needed
  for (const name of roles) {
    const exists = await Role.findOne({ name });
    if (!exists) {
      await Role.create({ name });
      console.log(`✅ Created role: ${name}`);
    }
  }
};
await seedRoles();

// ---------- Start server ----------
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Allowed origin: ${CLIENT_URL}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health (or / on your deployed URL)`);
});

// ---------- Graceful shutdown (handles SIGTERM from Render) ----------
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, closing server...");
  server.close(() => {
    console.log("✅ Server closed gracefully");
    process.exit(0);
  });
});

// ---------- Global error handlers ----------
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});