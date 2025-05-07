// Load environment variables
require("dotenv").config()

// Import required modules
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const cookieParser = require("cookie-parser")
const http = require("http")
const { Server } = require("socket.io")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")

// Create Express app
const app = express()
const server = http.createServer(app)

// Get frontend URL from environment or use a default
const FRONTEND_URL = process.env.FRONTEND_URL || "https://chautarii.vercel.app"
console.log(`Frontend URL set to: ${FRONTEND_URL}`)

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("✅ MongoDB Connected")
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message)
    process.exit(1)
  }
}

// Initialize Socket.io with specific CORS settings
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL, // Use specific origin instead of wildcard
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  },
  pingTimeout: 60000,
})

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

// Configure CORS with specific origin
app.use(
  cors({
    origin: FRONTEND_URL, // Use specific origin instead of wildcard
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  }),
)

// Handle preflight requests
app.options(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  }),
)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)
app.use(compression())

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/api/", apiLimiter)

// Logging middleware in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Make io accessible to routes
app.set("io", io)

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  const userId = socket.handshake.query.userId
  if (userId) {
    socket.join(userId)
    console.log(`User ${userId} joined their private room`)
    socket.emit("connected", { userId, socketId: socket.id })
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Define routes
try {
  app.use("/api/auth", require("./routes/authRoutes"))
  app.use("/api/users", require("./routes/userRoutes"))
  app.use("/api/posts", require("./routes/postRoutes"))
  app.use("/api/comments", require("./routes/commentRoutes"))
  app.use("/api/replies", require("./routes/replyRoutes"))
  app.use("/api/notifications", require("./routes/notificationRoutes"))
  app.use("/api/admin", require("./routes/adminRoutes"))
  app.use("/api/reports", require("./routes/reportRoutes"))
  app.use("/api/admin/users", require("./routes/userManagementRoutes"))
} catch (error) {
  console.error("Error loading routes:", error)
}

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack)
  res.status(500).json({
    message: err.message || "Something went wrong on the server",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  })
})

// Handle 404 routes
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ message: "Route not found" })
})

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"))
  })
}

// Start server
const PORT = process.env.PORT || 5000

// Connect to database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`)
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`)
  // Don't exit the process, just log the error
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`)
  // Don't exit the process, just log the error
})
