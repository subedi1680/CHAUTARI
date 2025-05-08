const User = require("../models/User")
const Post = require("../models/Post")
const Comment = require("../models/Comment")

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server Error")
  }
}

// @desc    Get user activity log
// @route   GET /api/users/activity
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id
    const activities = []

    // Get user's posts
    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 }).select("_id title category createdAt")

    // Add post creation activities
    posts.forEach((post) => {
      activities.push({
        id: `post-${post._id}`,
        type: "post",
        action: "created",
        content: post.title,
        target: post._id,
        timestamp: post.createdAt,
        category: post.category,
      })
    })

    // Get user's comments
    const comments = await Comment.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("post", "title category")
      .select("_id content post createdAt")

    // Add comment activities
    comments.forEach((comment) => {
      if (comment.post) {
        activities.push({
          id: `comment-${comment._id}`,
          type: "comment",
          action: "commented",
          content: comment.content,
          postTitle: comment.post.title,
          postId: comment.post._id,
          timestamp: comment.createdAt,
          category: comment.post.category,
        })
      }
    })

    // Get posts liked/disliked by user
    const likedPosts = await Post.find({ likedBy: userId }).select("_id title category")

    const dislikedPosts = await Post.find({ dislikedBy: userId }).select("_id title category")

    // Add like activities
    likedPosts.forEach((post) => {
      activities.push({
        id: `like-${post._id}`,
        type: "reaction",
        action: "liked",
        postTitle: post.title,
        postId: post._id,
        timestamp: new Date(), // This is a simplification; ideally track when the like happened
        category: post.category,
      })
    })

    // Add dislike activities
    dislikedPosts.forEach((post) => {
      activities.push({
        id: `dislike-${post._id}`,
        type: "reaction",
        action: "disliked",
        postTitle: post.title,
        postId: post._id,
        timestamp: new Date(), // This is a simplification; ideally track when the dislike happened
        category: post.category,
      })
    })

    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json(activities)
  } catch (err) {
    console.error("Error fetching user activity:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update the profile update route to include avatar
const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No avatar image uploaded" })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Convert the uploaded image to base64
    const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`

    // Update the user's avatar
    user.avatar = avatarBase64
    await user.save()

    res.json({
      msg: "Avatar updated successfully",
      avatar: avatarBase64,
    })
  } catch (err) {
    console.error("Error updating avatar:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Add a new function to remove user avatar
const removeUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Remove the avatar by setting it to empty string
    user.avatar = ""
    await user.save()

    res.json({
      msg: "Avatar removed successfully",
      avatar: "",
    })
  } catch (err) {
    console.error("Error removing avatar:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  getUserProfile,
  getUserActivity,
  updateUserAvatar,
  removeUserAvatar,
}
