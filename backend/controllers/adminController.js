const Admin = require("../models/Admin")
const Post = require("../models/Post")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map()

// Configure nodemailer with better error handling
const createTransporter = () => {
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("Email credentials are missing. Please check your environment variables.")
    return null
  }

  const service = process.env.EMAIL_SERVICE || "gmail"

  try {
    return nodemailer.createTransport({
      service: service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Helps with some email providers
      },
    })
  } catch (error) {
    console.error("Failed to create email transporter:", error)
    return null
  }
}

// @desc    Send OTP to admin's email
// @route   POST /api/admin/send-otp
// @access  Public
const sendAdminOtp = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ msg: "Email is required" })
  }

  try {
    // Check if email exists in admin database
    const admin = await Admin.findOne({ email, active: true })

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found or inactive" })
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    })

    // Create transporter for this request
    const transporter = createTransporter()
    if (!transporter) {
      return res.status(500).json({ msg: "Email service configuration error. Please contact support." })
    }

    // Send email with OTP
    const mailOptions = {
      from: `"CHAUTARI Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for CHAUTARI Admin Login",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>CHAUTARI Admin Login</h2>
          <p>Your One-Time Password (OTP) for admin login is:</p>
          <h1 style="font-size: 32px; letter-spacing: 2px; color: #333; background: #f5f5f5; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <p>Thank you,<br>CHAUTARI Team</p>
        </div>
      `,
    }

    try {
      await transporter.sendMail(mailOptions)
      res.status(200).json({ msg: "OTP sent successfully" })
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      res.status(500).json({ msg: "Failed to send OTP email. Please try again later." })
    }
  } catch (err) {
    console.error("OTP sending error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Verify OTP and login admin
// @route   POST /api/admin/verify-otp
// @access  Public
const verifyAdminOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ msg: "Email and OTP are required" })
  }

  try {
    // Check if OTP exists and is valid
    const otpData = otpStore.get(email)

    if (!otpData) {
      return res.status(400).json({ msg: "OTP expired or not found. Please request a new one." })
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ msg: "OTP has expired. Please request a new one." })
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." })
    }

    // OTP is valid, delete it from store
    otpStore.delete(email)

    // Find admin in database
    const admin = await Admin.findOne({ email, active: true })

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found or inactive" })
    }

    // Update last login time
    admin.lastLogin = Date.now()
    await admin.save()

    // Generate JWT token
    const payload = {
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err
      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      })
    })
  } catch (err) {
    console.error("OTP verification error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get all pending posts
// @route   GET /api/admin/posts/pending
// @access  Private (Admin only)
const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending" })
      .populate("user", ["username", "email", "avatar"])
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching pending posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get all posts (with filter options)
// @route   GET /api/admin/posts
// @access  Private (Admin only)
const getAllPosts = async (req, res) => {
  try {
    const { status, category, search } = req.query
    const query = {}

    // Apply filters if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
    }

    const posts = await Post.find(query).populate("user", ["username", "email", "avatar"]).sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Approve a post
// @route   PUT /api/admin/posts/:id/approve
// @access  Private (Admin only)
const approvePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "username")

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    post.status = "approved"
    post.rejectionReason = "" // Clear any previous rejection reason
    await post.save()

    // Notify the user that their post was approved
    try {
      const notificationController = require("./notificationController")
      const notificationData = {
        recipient: post.user._id,
        type: "system",
        content: `Your post "${post.title}" has been approved by an admin.`,
        relatedPost: post._id,
      }
      await notificationController.createNotification(notificationData)
    } catch (notifError) {
      console.error("Error creating post approval notification:", notifError)
    }

    // Emit socket event for real-time updates
    const io = req.app.get("io")
    if (io) {
      // Notify all admins
      io.to("admins").emit("postStatusChanged", {
        postId: post._id,
        title: post.title,
        oldStatus: "pending",
        newStatus: "approved",
        username: post.user.username,
      })

      // Notify the post author
      io.to(post.user._id.toString()).emit("postStatusChanged", {
        postId: post._id,
        title: post.title,
        status: "approved",
      })
    }

    res.json({ msg: "Post approved successfully", post })
  } catch (err) {
    console.error("Error approving post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Reject a post
// @route   PUT /api/admin/posts/:id/reject
// @access  Private (Admin only)
const rejectPost = async (req, res) => {
  const { reason } = req.body

  try {
    const post = await Post.findById(req.params.id).populate("user", "username")

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    post.status = "rejected"
    post.rejectionReason = reason || "Content does not meet community guidelines"
    await post.save()

    // Notify the user that their post was rejected
    try {
      const notificationController = require("./notificationController")
      const notificationData = {
        recipient: post.user._id,
        type: "system",
        content: `Your post "${post.title}" has been rejected. Reason: ${post.rejectionReason}`,
        relatedPost: post._id,
      }
      await notificationController.createNotification(notificationData)
    } catch (notifError) {
      console.error("Error creating post rejection notification:", notifError)
    }

    // Emit socket event for real-time updates
    const io = req.app.get("io")
    if (io) {
      // Notify all admins
      io.to("admins").emit("postStatusChanged", {
        postId: post._id,
        title: post.title,
        oldStatus: "pending",
        newStatus: "rejected",
        username: post.user.username,
        reason: post.rejectionReason,
      })

      // Notify the post author
      io.to(post.user._id.toString()).emit("postStatusChanged", {
        postId: post._id,
        title: post.title,
        status: "rejected",
        reason: post.rejectionReason,
      })
    }

    res.json({ msg: "Post rejected successfully", post })
  } catch (err) {
    console.error("Error rejecting post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const pendingCount = await Post.countDocuments({ status: "pending" })
    const approvedCount = await Post.countDocuments({ status: "approved" })
    const rejectedCount = await Post.countDocuments({ status: "rejected" })
    const totalPosts = pendingCount + approvedCount + rejectedCount

    // Get counts by category
    const categories = await Post.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get recent activity
    const recentActivity = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", ["username"])
      .select("title status createdAt user")

    // Get user statistics
    const User = require("../models/User")

    // Total users
    const totalUsers = await User.countDocuments()

    res.json({
      postCounts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalPosts,
      },
      userCounts: {
        total: totalUsers,
      },
      categories,
      recentActivity,
    })
  } catch (err) {
    console.error("Error fetching admin stats:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Add a new admin
// @route   POST /api/admin/add
// @access  Private (Super Admin only)
const addAdmin = async (req, res) => {
  const { email, role } = req.body

  // Check if the requesting admin is a super_admin
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ msg: "Not authorized to add admins" })
  }

  try {
    // Check if admin already exists
    let admin = await Admin.findOne({ email })

    if (admin) {
      return res.status(400).json({ msg: "Admin already exists" })
    }

    // Create new admin
    admin = new Admin({
      email,
      role: role || "admin", // Default to regular admin if not specified
    })

    await admin.save()

    res.status(201).json({ msg: "Admin added successfully", admin })
  } catch (err) {
    console.error("Error adding admin:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Remove an admin
// @route   DELETE /api/admin/:id
// @access  Private (Super Admin only)
const removeAdmin = async (req, res) => {
  // Check if the requesting admin is a super_admin
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ msg: "Not authorized to remove admins" })
  }

  try {
    const admin = await Admin.findById(req.params.id)

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" })
    }

    // Prevent removing oneself
    if (admin._id.toString() === req.admin.id) {
      return res.status(400).json({ msg: "Cannot remove yourself" })
    }

    await admin.deleteOne()

    res.json({ msg: "Admin removed successfully" })
  } catch (err) {
    console.error("Error removing admin:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get all admins
// @route   GET /api/admin/all
// @access  Private (Super Admin only)
const getAllAdmins = async (req, res) => {
  // Check if the requesting admin is a super_admin
  if (req.admin.role !== "super_admin") {
    return res.status(403).json({ msg: "Not authorized to view all admins" })
  }

  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 })
    res.json(admins)
  } catch (err) {
    console.error("Error fetching admins:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  sendAdminOtp,
  verifyAdminOtp,
  getPendingPosts,
  getAllPosts,
  approvePost,
  rejectPost,
  getAdminStats,
  addAdmin,
  removeAdmin,
  getAllAdmins,
}
