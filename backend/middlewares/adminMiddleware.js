const jwt = require("jsonwebtoken")
const Admin = require("../models/Admin")

const adminAuth = async (req, res, next) => {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.admin.id)
    if (!admin || !admin.active) {
      return res.status(401).json({ msg: "Admin not found or inactive" })
    }

    // Add admin info to request
    req.admin = decoded.admin
    next()
  } catch (err) {
    console.error("Admin auth error:", err.message)
    res.status(401).json({ msg: "Token is not valid" })
  }
}

// Middleware to check if admin is a super_admin
const superAdminAuth = (req, res, next) => {
  if (req.admin && req.admin.role === "super_admin") {
    next()
  } else {
    res.status(403).json({ msg: "Access denied. Super admin privileges required." })
  }
}

module.exports = { adminAuth, superAdminAuth }
