// Add this at the beginning of your server.js file
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASSWORD", "FRONTEND_URL"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "))
  console.error("Please check your .env file and make sure all required variables are set.")
  process.exit(1)
}

const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")

dotenv.config()

// ✅ Normalize frontend URL (remove trailing slash if any)
const allowedOrigin = process.env.FRONTEND_URL?.replace(/\/$/, "") || "*"

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
  const adminRoutes = require("./routes/adminRoutes")
  const reportRoutes = require("./routes/reportRoutes")
  const userManagementRoutes = require("./routes/userManagementRoutes")

  const app = express()
  const PORT = process.env.PORT || 5000

  // Create HTTP server for socket.io
  const server = http.createServer(app)

  // ✅ Set up Socket.io with normalized origin
  const io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST", "DELETE", "PUT"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e8,
  })

  global.io = io

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id)

    const userId = socket.handshake.query.userId

    if (userId) {
      socket.join(userId)
      console.log(`User ${userId} joined their private room`)
      socket.emit("socketConnected", { userId, socketId: socket.id })
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })

    const adminToken = socket.handshake.query.adminToken

    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET)
        const adminId = decoded.admin.id

        console.log(`Admin connected: ${adminId}`)
        socket.join("admins")

        socket.on("postStatusChanged", (data) => {
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

  // ✅ Apply CORS with normalized origin
  app.use(cors({
    origin: allowedOrigin,
    credentials: true,
  }))

  // ✅ Ensure preflight requests are handled
  app.options("*", cors({
    origin: allowedOrigin,
    credentials: true,
  }))

  app.use(express.json({ limit: "50mb" }))
  app.use(express.urlencoded({ extended: true, limit: "50mb" }))

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
  app.use("/api/admin", adminRoutes)
  app.use("/api/reports", reportRoutes)
  app.use("/api/admin/users", userManagementRoutes)
  app.use("/api/admin/users", require("./routes/userManagementRoutes"))

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

  server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))
}
