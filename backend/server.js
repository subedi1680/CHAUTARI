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

// Initialize Socket.IO server
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

// Make io available globally for notifications
global.io = io

// Handle Socket.IO connection with improved error handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join a room with the user's ID for private notifications
  if (socket.handshake.query && socket.handshake.query.userId) {
    const userId = socket.handshake.query.userId
    socket.join(userId)
    console.log(`User ${userId} joined their private room`)

    // Send a confirmation to the client
    socket.emit("socketConnected", { userId, socketId: socket.id })
  }

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected (${reason}):`, socket.id)
  })
})

// Middlewares
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Attach io to every request (for real-time updates)
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
