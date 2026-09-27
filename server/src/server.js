const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config(); // Also check current working directory
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const typingEventRoutes = require("./routes/typingEvents");
const wellnessRoutes = require("./routes/wellness");
const adminRoutes = require("./routes/admin");
const { registerChatHandlers } = require("./sockets/chatHandler");

// Ensure MongoDB Models are loaded and schemas indexed
require("./models/User");
require("./models/TypingEvent");
require("./models/WellnessAlert");
require("./models/Message");

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true
  })
);

app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Provide io instance to Express routes
app.set("io", io);

registerChatHandlers(io);

// Health route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Silent Alarm Backend",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/typing-event", typingEventRoutes);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Silent Alarm Server running on port ${PORT}`);
    console.log(`Ready for REST and Socket.io connections`);
    console.log(`========================================`);
  });
});

module.exports = { app, server };
