// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ROUTES
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import fileRoutes from "./routes/files.js";
import statusRoutes from "./routes/status.js";
import conversationsRoutes from "./routes/conversations.js";

// MODELS
import Message from "./models/Message.js";

// dirname fix (because ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EXPRESS INIT — MUST COME BEFORE app.use()
const app = express();
const server = http.createServer(app);

// FRONTEND URL(s) for CORS & socket origin
// Accepts comma-separated values, e.g. "https://app.vercel.app,https://my-preview.vercel.app"
// or a single '*' to allow all origins (not recommended for production)
const FRONTEND = process.env.FRONTEND_URL || 'https://banja-sports.vercel.app,https://*.vercel.app';
const allowedOrigins = String(FRONTEND)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function originMatchesPattern(origin, pattern) {
  // pattern can be a host wildcard like '*.vercel.app' or include protocol 'https://*.vercel.app'
  if (!origin || !pattern) return false;

  try {
    const originUrl = new URL(origin);
    let host = originUrl.host.toLowerCase(); // includes port if present

    // remove protocol from pattern if present
    let p = pattern.replace(/^https?:\/\//i, '').toLowerCase();

    // exact host match
    if (p === host) return true;

    // wildcard patterns
    if (p.includes('*')) {
      // convert wildcard to regex
      const regex = new RegExp('^' + p.split('*').map(escapeRegExp).join('.*') + '$');
      return regex.test(host);
    }

    return false;
  } catch (e) {
    return false;
  }
}

function isOriginAllowed(origin) {
  if (!origin) return true; // non-browser requests
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;

  // allow patterns
  for (const p of allowedOrigins) {
    if (p.includes('*') && originMatchesPattern(origin, p)) return true;
  }

  return false;
}

// SOCKET.IO
const io = new Server(server, {
  cors: {
    // socket.io supports function origins — we use a checker so patterns are allowed
    origin: function (origin, callback) {
      try {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed'), false);
      } catch (e) {
        return callback(new Error('Origin check failed'), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// expose io
app.set("io", io);
const onlineUsers = new Map();
app.set("onlineUsers", onlineUsers);

// middleware
// Express CORS — allow requests only from allowedOrigins or '*' handling
app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests (eg. server-to-server, curl) when origin is undefined
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));

// static uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(path.join(__dirname, "..", UPLOAD_DIR)));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/conversations", conversationsRoutes);

// lightweight health check (useful for probes / verify deployment)
app.get('/', (req, res) => res.json({ ok: true, service: 'banja-backend' }));

// SOCKET.IO LOGIC
io.on("connection", (socket) => {
  console.log("[socket] connected:", socket.id);

  // track presence
  const clientUser = socket.handshake.auth?.user;
  if (clientUser) {
    const uid = clientUser.id || clientUser._id;
    if (uid) {
      onlineUsers.set(uid, socket.id);
      io.emit("presence_update", { userId: uid, status: "online" });
    }
  }

  socket.on("join_room", (room) => socket.join(room));

  // SEND MESSAGE
  socket.on("send_message", async ({ room, message }) => {
    try {
      const saved = await Message.create({
        sender: message.sender?._id || message.sender,
        text: message.text,
        room,
        fileUrl: message.fileUrl || "",
        replyTo: message.replyTo || null,
        createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
      });

      const populated = await Message.findById(saved._id)
        .populate("sender", "username avatar")
        .populate("replyTo")
        .populate("readBy", "username");

      io.to(room).emit("receive_message", populated);
    } catch (err) {
      console.error("send_message error:", err);
      socket.emit("error_message", { message: "failed to save message" });
    }
  });

  // EDIT MESSAGE
  socket.on("edit_message", async ({ room, messageId, text }) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { text, edited: true },
        { new: true }
      )
        .populate("sender", "username avatar")
        .populate("replyTo")
        .populate("readBy", "username");

      if (updated) io.to(room).emit("message_edited", updated);
    } catch (err) {
      console.error("edit_message error:", err);
    }
  });

  // DELETE MESSAGE
  socket.on("delete_message", async ({ room, messageId }) => {
    try {
      await Message.findByIdAndDelete(messageId);
      io.to(room).emit("message_deleted", messageId);
    } catch (err) {
      console.error("delete_message error:", err);
    }
  });

  // REACT TO MESSAGE
  socket.on("react", async ({ room, messageId, userId, emoji }) => {
    try {
      const uid = userId._id || userId.id || userId;
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const existing = msg.reactions.find((r) => String(r.userId) === String(uid));

      // toggle
      if (existing && existing.emoji === emoji) {
        msg.reactions = msg.reactions.filter((r) => String(r.userId) !== String(uid));
      } else {
        msg.reactions = msg.reactions.filter((r) => String(r.userId) !== String(uid));
        msg.reactions.push({ userId: uid, emoji });
      }

      await msg.save();

      const populated = await Message.findById(messageId)
        .populate("sender", "username avatar")
        .populate("replyTo")
        .populate("readBy", "username");

      io.to(room).emit("reaction_update", populated);
    } catch (err) {
      console.error("react error:", err);
    }
  });

  // TYPING
  socket.on("typing", ({ room, userId, typing }) => {
    socket.to(room).emit("typing", { userId, typing });
  });

  // MESSAGE DELIVERED
  socket.on("message_delivered", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && !message.deliveredTo.includes(userId)) {
        message.deliveredTo.push(userId);
        await message.save();
        
        const populated = await Message.findById(messageId)
          .populate("sender", "username avatar")
          .populate("deliveredTo", "username")
          .populate("readBy", "username");
        
        io.to(message.room).emit("message_status_update", populated);
      }
    } catch (err) {
      console.error("message_delivered error:", err);
    }
  });

  // MESSAGE READ
  socket.on("message_read", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && !message.readBy.includes(userId)) {
        if (!message.deliveredTo.includes(userId)) {
          message.deliveredTo.push(userId);
        }
        message.readBy.push(userId);
        await message.save();
        
        const populated = await Message.findById(messageId)
          .populate("sender", "username avatar")
          .populate("deliveredTo", "username")
          .populate("readBy", "username");
        
        io.to(message.room).emit("message_status_update", populated);
      }
    } catch (err) {
      console.error("message_read error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        io.emit("presence_update", { userId: uid, status: "offline" });
        break;
      }
    }
  });
});

// DB + START SERVER
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log("Server running on", PORT));
  })
  .catch((err) => {
    console.error("Mongo error:", err);
    process.exit(1);
  });
