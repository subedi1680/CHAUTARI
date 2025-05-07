const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")
const dotenv = require("dotenv")
const path = require("path")
const http = require("http")
const socketIo = require("socket.io")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const app = express()
const server = http.createServer(app)

// Set up Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
)

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
})
app.use("/api/", limiter)

// Logging middleware in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected")

  // Handle authentication
  socket.on("authenticate", (token) => {
    // Verify token and associate socket with user
    // This is a placeholder - implement actual token verification
    console.log("User authenticated with socket")
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// Make io accessible to routes
app.set("io", io)

// Define routes
app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/users", require("./routes/userRoutes"))
app.use("/api/posts", require("./routes/postRoutes"))
app.use("/api/comments", require("./routes/commentRoutes"))
app.use("/api/replies", require("./routes/replyRoutes"))
app.use("/api/reports", require("./routes/reportRoutes"))
app.use("/api/notifications", require("./routes/notificationRoutes"))
app.use("/api/admin", require("./routes/adminRoutes"))
app.use("/api/user-management", require("./routes/userManagementRoutes"))

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: err.message || "Something went wrong on the server",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  })
})

// Handle 404 routes
app.use((req, res) => {
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

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`)
  // Close server & exit process
  // server.close(() => process.exit(1))
})
