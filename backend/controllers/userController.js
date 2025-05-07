const User = require("../models/User")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const Reply = require("../models/Reply")
const bcrypt = require("bcryptjs")
const fs = require("fs")
const path = require("path")

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json(user)
  } catch (err) {
    console.error("Error fetching user profile:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -email -dateOfBirth")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }
    res.json(user)
  } catch (err) {
    console.error("Error fetching user:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const { username, bio, interests } = req.body

  try {
    // Check if username is taken (if changing username)
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } })
      if (existingUser) {
        return res.status(400).json({ msg: "Username already taken" })
      }
    }

    // Build update object
    const updateFields = {}
    if (username) updateFields.username = username
    if (bio !== undefined) updateFields.bio = bio
    if (interests) updateFields.interests = interests

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true }).select(
      "-password",
    )

    res.json(updatedUser)
  } catch (err) {
    console.error("Error updating profile:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" })
    }

    // Get the old avatar path to delete it later
    const user = await User.findById(req.user.id)
    const oldAvatarPath = user.avatar

    // Update with new avatar path
    const avatarUrl = `/uploads/${req.file.filename}`
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: avatarUrl } },
      { new: true },
    ).select("-password")

    // Delete old avatar if it exists and is not the default
    if (oldAvatarPath && !oldAvatarPath.includes("default-avatar") && oldAvatarPath.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", oldAvatarPath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    res.json(updatedUser)
  } catch (err) {
    console.error("Error updating avatar:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Current password and new password are required" })
  }

  try {
    const user = await User.findById(req.user.id)

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" })
    }

    // Validate new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)

    await user.save()

    res.json({ msg: "Password updated successfully" })
  } catch (err) {
    console.error("Error changing password:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user posts
// @route   GET /api/users/:id/posts
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id, status: "approved" })
      .sort({ createdAt: -1 })
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching user posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get current user's posts (including pending/rejected)
// @route   GET /api/users/me/posts
// @access  Private
const getCurrentUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching current user posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user's saved posts
// @route   GET /api/users/me/saved
// @access  Private
const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const savedPosts = await Post.find({ _id: { $in: user.savedPosts }, status: "approved" })
      .sort({ createdAt: -1 })
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })

    res.json(savedPosts)
  } catch (err) {
    console.error("Error fetching saved posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Save/unsave a post
// @route   PUT /api/users/posts/:id/save
// @access  Private
const toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const postId = req.params.id

    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Check if post is already saved
    const isSaved = user.savedPosts.includes(postId)

    if (isSaved) {
      // Unsave post
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId)
      await user.save()
      res.json({ msg: "Post unsaved", saved: false })
    } else {
      // Save post
      user.savedPosts.push(postId)
      await user.save()
      res.json({ msg: "Post saved", saved: true })
    }
  } catch (err) {
    console.error("Error toggling save post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Check if a post is saved by current user
// @route   GET /api/users/posts/:id/saved
// @access  Private
const checkPostSaved = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const postId = req.params.id

    const isSaved = user.savedPosts.includes(postId)
    res.json({ saved: isSaved })
  } catch (err) {
    console.error("Error checking saved status:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user's categories
// @route   GET /api/users/me/categories
// @access  Private
const getUserCategories = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({
      categories: user.preferredCategories || [],
      categorySetupCompleted: user.categorySetupCompleted,
    })
  } catch (err) {
    console.error("Error fetching user categories:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Update user's categories
// @route   PUT /api/users/me/categories
// @access  Private
const updateUserCategories = async (req, res) => {
  const { categories } = req.body

  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ msg: "Categories must be an array" })
  }

  try {
    const user = await User.findById(req.user.id)
    user.preferredCategories = categories
    user.categorySetupCompleted = true
    await user.save()

    res.json({
      categories: user.preferredCategories,
      categorySetupCompleted: user.categorySetupCompleted,
    })
  } catch (err) {
    console.error("Error updating user categories:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get user's activity stats
// @route   GET /api/users/:id/stats
// @access  Public
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id

    // Count posts
    const postCount = await Post.countDocuments({ user: userId, status: "approved" })

    // Count comments
    const commentCount = await Comment.countDocuments({ user: userId })

    // Count replies
    const replyCount = await Reply.countDocuments({ user: userId })

    // Get user join date
    const user = await User.findById(userId).select("createdAt")
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    res.json({
      posts: postCount,
      comments: commentCount,
      replies: replyCount,
      joinDate: user.createdAt,
    })
  } catch (err) {
    console.error("Error fetching user stats:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  changePassword,
  getUserPosts,
  getCurrentUserPosts,
  getSavedPosts,
  toggleSavePost,
  checkPostSaved,
  getUserCategories,
  updateUserCategories,
  getUserStats,
}
