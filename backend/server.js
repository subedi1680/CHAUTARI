// server.js

const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken") // Add jwt

dotenv.config()

// Connect to MongoDB first, before importing routes
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB")
    startServer()
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err))

function startServer() {
  // Import routes after MongoDB connection
  const authRoutes = require("./routes/authRoutes")
  const postRoutes = require("./routes/postRoutes")
  const userRoutes = require("./routes/userRoutes")
  const commentRoutes = require("./routes/commentRoutes")
  const replyRoutes = require("./routes/replyRoutes")
  const notificationRoutes = require("./routes/notificationRoutes")
  const adminRoutes = require("./routes/adminRoutes") // Add admin routes
  const reportRoutes = require("./routes/reportRoutes") // Add report routes
  const userManagementRoutes = require("./routes/userManagementRoutes")

  const app = express()
  const PORT = process.env.PORT || 5000

  // Create HTTP server for socket.io
  const server = http.createServer(app)

  // Set up Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
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

    // Check if this is an admin connection
    const adminToken = socket.handshake.query.adminToken

    if (adminToken) {
      try {
        // Verify admin token
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET)
        const adminId = decoded.admin.id

        console.log(`Admin connected: ${adminId}`)

        // Join admin room
        socket.join("admins")

        // Handle admin-specific events
        socket.on("postStatusChanged", (data) => {
          // Broadcast to all admins
          io.to("admins").emit("postStatusChanged", data)
        })

        socket.on("disconnect", () => {
          console.log(`Admin disconnected: ${adminId}`)
        })
      } catch (err) {
        console.error("Invalid admin token:", err.message)
      }
    }
  })

  // Middlewares
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
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
  app.use("/api/admin", adminRoutes) // Add admin routes
  app.use("/api/reports", reportRoutes) // Register report routes
  app.use("/api/admin/users", userManagementRoutes)

  // Make sure the admin user management routes are properly registered
  app.use("/api/admin/users", require("./routes/userManagementRoutes"))

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

  // Start server
  server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))
}
