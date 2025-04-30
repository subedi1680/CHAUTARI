// server.js

const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const nodemailer = require("nodemailer")

// Route imports
const authRoutes = require("./routes/authRoutes")
const postRoutes = require("./routes/postRoutes")
const userRoutes = require("./routes/userRoutes")
const commentRoutes = require("./routes/commentRoutes")
const replyRoutes = require("./routes/replyRoutes")
const notificationRoutes = require("./routes/notificationRoutes")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Create HTTP server for socket.io
const server = http.createServer(app)

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
  // Add these options for better performance
  transports: ["websocket", "polling"],
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
})

// Make io available globally
global.io = io

// Set up Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  // Get userId from query params
  const userId = socket.handshake.query.userId

  if (userId) {
    // Join a room with the user's ID for private notifications
    socket.join(userId)
    console.log(`User ${userId} joined their private room`)

    // Confirm connection to client
    socket.emit("socketConnected", { userId, socketId: socket.id })
  }

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

// Middlewares
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Make io available to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/users", userRoutes)
app.use("/api", commentRoutes)
app.use("/api", replyRoutes)
app.use("/api/notifications", notificationRoutes)

// Test route for email configuration
app.get("/api/test-email", (req, res) => {
  const emailConfig = {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER ? "Set" : "Not set",
    password: process.env.EMAIL_PASSWORD ? "Set" : "Not set",
  }

  res.json({
    message: "Email configuration status",
    config: emailConfig,
  })
})

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB")
    server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err))
