const User = require("../models/User")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const Reply = require("../models/Reply")
const { createNotification } = require("./notificationController")

// @desc    Get all users with pagination and search
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sort = "username" } = req.query
    const query = {}

    // Apply search filter if provided
    if (search) {
      query.$or = [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    // Sort direction
    const sortDirection = sort.startsWith("-") ? -1 : 1
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get total count for pagination
    const total = await User.countDocuments(query)

    // Get users with pagination
    const users = await User.find(query)
      .select("username email avatar violationCount isBanned banExpiresAt banReason lastLogin lastActive createdAt")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Check if any temporary bans have expired
    for (const user of users) {
      if (user.isBanned && user.banExpiresAt && new Date() > user.banExpiresAt) {
        user.isBanned = false
        user.banExpiresAt = null
        user.banReason = ""
        await user.save()

        // Notify user that their ban has expired
        try {
          await createNotification({
            recipient: user._id,
            type: "system",
            content: "Your account ban has expired. You can now post and comment again.",
          })
        } catch (notifError) {
          console.error("Error creating ban expiry notification:", notifError)
        }
      }
    }

    // Get post and comment counts for each user
    const userIds = users.map((user) => user._id)

    // Get post counts
    const postCounts = await Post.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ])

    // Get comment counts
    const commentCounts = await Comment.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ])

    // Create lookup maps for faster access
    const postCountMap = {}
    const commentCountMap = {}

    postCounts.forEach((item) => {
      postCountMap[item._id.toString()] = item.count
    })

    commentCounts.forEach((item) => {
      commentCountMap[item._id.toString()] = item.count
    })

    // Add counts to user objects
    const usersWithCounts = users.map((user) => {
      const userObj = user.toObject()
      userObj.postCount = postCountMap[user._id.toString()] || 0
      userObj.commentCount = commentCountMap[user._id.toString()] || 0
      return userObj
    })

    res.json({
      users: usersWithCounts,
      pagination: {
        total,
        page: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        limit: Number.parseInt(limit),
      },
    })
  } catch (err) {
    console.error("Error fetching users:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user details including violation history
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate({
      path: "violationHistory.reportId",
      select: "reason contentType contentId status",
    })

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ user: user._id })

    // Get user's comments count
    const commentsCount = await Comment.countDocuments({ user: user._id })

    // Get user's replies count
    const repliesCount = await Reply.countDocuments({ user: user._id })

    res.json({
      user,
      stats: {
        postsCount,
        commentsCount,
        repliesCount,
      },
    })
  } catch (err) {
    console.error("Error fetching user details:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Reset user's violation count
// @route   PUT /api/admin/users/:id/reset-violations
// @access  Private (Admin only)
const resetViolations = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Reset violation count
    user.violationCount = 0

    // If user is temporarily banned, remove the ban
    if (user.isBanned && user.banExpiresAt) {
      user.isBanned = false
      user.banExpiresAt = null
      user.banReason = ""
    }

    // Add admin note to violation history
    user.violationHistory.push({
      date: new Date(),
      reason: "Admin reset violations",
      actionTaken: "warning", // Using warning as a neutral action type
    })

    await user.save()

    // Notify user
    try {
      await createNotification({
        recipient: user._id,
        type: "system",
        content: "An administrator has reset your violation count. Your account is now in good standing.",
      })
    } catch (notifError) {
      console.error("Error creating violation reset notification:", notifError)
    }

    res.json({ msg: "User violations reset successfully", user })
  } catch (err) {
    console.error("Error resetting violations:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Ban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
const banUser = async (req, res) => {
  const { reason, duration } = req.body

  if (!reason) {
    return res.status(400).json({ msg: "Please provide a reason for the ban" })
  }

  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Set ban status
    user.isBanned = true
    user.banReason = reason

    // Set ban duration
    if (duration === "permanent") {
      user.banExpiresAt = null // Permanent ban
    } else {
      // Convert duration to days
      const days = Number.parseInt(duration) || 1
      user.banExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }

    // Add to violation history
    user.violationHistory.push({
      date: new Date(),
      reason: `Admin ban: ${reason}`,
      actionTaken: duration === "permanent" ? "permanent_ban" : "temp_ban",
    })

    await user.save()

    // Notify user
    try {
      const banMessage =
        duration === "permanent"
          ? "Your account has been permanently banned."
          : `Your account has been temporarily banned until ${user.banExpiresAt.toLocaleDateString()}.`

      await createNotification({
        recipient: user._id,
        type: "system",
        content: `${banMessage} Reason: ${reason}`,
      })
    } catch (notifError) {
      console.error("Error creating ban notification:", notifError)
    }

    res.json({ msg: "User banned successfully", user })
  } catch (err) {
    console.error("Error banning user:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Unban a user
// @route   PUT /api/admin/users/:id/unban
// @access  Private (Admin only)
const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Check if user is banned
    if (!user.isBanned) {
      return res.status(400).json({ msg: "User is not currently banned" })
    }

    // Remove ban
    user.isBanned = false
    user.banExpiresAt = null
    user.banReason = ""

    // Add to violation history
    user.violationHistory.push({
      date: new Date(),
      reason: "Admin removed ban",
      actionTaken: "warning", // Using warning as a neutral action type
    })

    await user.save()

    // Notify user
    try {
      await createNotification({
        recipient: user._id,
        type: "system",
        content: "An administrator has removed your account ban. You can now post and comment again.",
      })
    } catch (notifError) {
      console.error("Error creating unban notification:", notifError)
    }

    res.json({ msg: "User unbanned successfully", user })
  } catch (err) {
    console.error("Error unbanning user:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Delete user's content (optional, could also just mark as deleted)
    await Post.deleteMany({ user: user._id })
    await Comment.deleteMany({ user: user._id })
    await Reply.deleteMany({ user: user._id })

    // Delete the user
    await user.deleteOne()

    res.json({ msg: "User account deleted successfully" })
  } catch (err) {
    console.error("Error deleting user:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user ban statistics
// @route   GET /api/admin/users/ban-stats
// @access  Private (Admin only)
const getBanStats = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments()

    // Count currently banned users
    const bannedUsers = await User.countDocuments({ isBanned: true })

    // Count temporarily banned users (with expiry date)
    const tempBannedUsers = await User.countDocuments({
      isBanned: true,
      banExpiresAt: { $ne: null },
    })

    // Count permanently banned users
    const permBannedUsers = await User.countDocuments({
      isBanned: true,
      banExpiresAt: null,
    })

    // Count users with violations
    const usersWithViolations = await User.countDocuments({
      violationCount: { $gt: 0 },
    })

    // Get violation distribution
    const violationDistribution = await User.aggregate([
      {
        $group: {
          _id: "$violationCount",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json({
      totalUsers,
      bannedUsers,
      tempBannedUsers,
      permBannedUsers,
      usersWithViolations,
      violationDistribution,
    })
  } catch (err) {
    console.error("Error fetching ban stats:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update the getUserStats function to ensure it returns the correct data structure
const getUserStats = async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments()

    // Count banned users
    const bannedUsers = await User.countDocuments({ isBanned: true })

    // Count users with violations
    const usersWithViolations = await User.countDocuments({ violationCount: { $gt: 0 } })

    res.json({
      totalUsers,
      bannedUsers,
      usersWithViolations,
    })
  } catch (err) {
    console.error("Error fetching user stats:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Add getUserStats to the module exports
module.exports = {
  getAllUsers,
  getUserDetails,
  resetViolations,
  banUser,
  unbanUser,
  deleteUser,
  getBanStats,
  getUserStats,
}
