const mongoose = require("mongoose")
const Post = require("../models/Post")
const User = require("../models/User") // Import User model
const fs = require("fs")
const path = require("path")

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  const { title, content, category } = req.body

  if (!title || !content || !category) {
    return res.status(400).json({ msg: "Title, content, and category are required" })
  }

  try {
    // Check if user is banned
    const user = await User.findById(req.user.id)
    if (user && user.isCurrentlyBanned()) {
      let banMessage = "You cannot create posts while your account is banned."
      if (user.banExpiresAt) {
        const expiryDate = new Date(user.banExpiresAt).toLocaleDateString()
        banMessage += ` Your ban will expire on ${expiryDate}.`
      } else {
        banMessage += " Your account has been permanently banned."
      }

      return res.status(403).json({
        msg: banMessage,
        isBanned: true,
        banExpiresAt: user.banExpiresAt,
        banReason: user.banReason,
      })
    }

    // Create new post
    const newPost = new Post({
      title,
      content,
      category,
      user: req.user.id,
      status: "pending", // All posts start as pending for moderation
    })

    // If there's an image, add it to the post
    if (req.file) {
      newPost.image = `/uploads/${req.file.filename}`
    }

    await newPost.save()

    // Populate user info
    await newPost.populate("user", ["username", "avatar"])

    // Notify admins about new post
    const io = req.app.get("io")
    if (io) {
      io.to("admins").emit("newPost", {
        postId: newPost._id,
        title: newPost.title,
        username: req.user.username,
      })
    }

    res.status(201).json(newPost)
  } catch (err) {
    console.error("Error creating post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get all approved posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { category, search, sort = "latest" } = req.query

    // Build query
    const query = { status: "approved" }

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category
    }

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
    }

    // Determine sort order
    let sortOption = {}
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 }
        break
      case "most-commented":
        sortOption = { commentCount: -1, createdAt: -1 }
        break
      case "most-liked":
        sortOption = { likeCount: -1, createdAt: -1 }
        break
      default:
        // latest
        sortOption = { createdAt: -1 }
    }

    const posts = await Post.find(query).sort(sortOption).populate("user", ["username", "avatar"]).populate({
      path: "comments",
      select: "_id",
    })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get posts for user's feed (based on preferred categories)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = async (req, res) => {
  try {
    // Get user's preferred categories
    const user = await User.findById(req.user.id)
    const preferredCategories = user.preferredCategories || []

    // Build query - include posts from preferred categories and some general posts
    let query = { status: "approved" }

    // If user has preferred categories, prioritize those
    if (preferredCategories.length > 0) {
      query = {
        $or: [{ category: { $in: preferredCategories } }, { category: "general" }],
        status: "approved",
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 posts for performance
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching feed posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get a single post
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["username", "avatar", "bio"])
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username avatar",
        },
      })

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // If post is not approved and user is not the author, don't show it
    if (post.status !== "approved" && (!req.user || post.user._id.toString() !== req.user.id)) {
      return res.status(404).json({ msg: "Post not found or pending approval" })
    }

    // Increment view count
    post.views += 1
    await post.save()

    res.json(post)
  } catch (err) {
    console.error("Error fetching post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get user's own posts (including pending and rejected)
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    console.error("Failed to fetch user posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  const { title, content, category } = req.body

  try {
    let post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Check if user is the post author
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to update this post" })
    }

    // Build update object
    const updateFields = {}
    if (title) updateFields.title = title
    if (content) updateFields.content = content
    if (category) updateFields.category = category

    // If post was already approved, set it back to pending for re-moderation
    if (post.status === "approved") {
      updateFields.status = "pending"
    }

    // If there's a new image
    if (req.file) {
      // Delete old image if it exists
      if (post.image) {
        const oldImagePath = path.join(__dirname, "..", post.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      updateFields.image = `/uploads/${req.file.filename}`
    }

    // Update post
    post = await Post.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true }).populate("user", [
      "username",
      "avatar",
    ])

    // Notify admins about updated post that needs re-moderation
    if (updateFields.status === "pending") {
      const io = req.app.get("io")
      if (io) {
        io.to("admins").emit("postUpdated", {
          postId: post._id,
          title: post.title,
          username: req.user.username,
        })
      }
    }

    res.json(post)
  } catch (err) {
    console.error("Error updating post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Check if user is the post author
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to delete this post" })
    }

    // Delete image if it exists
    if (post.image) {
      const imagePath = path.join(__dirname, "..", post.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete post
    await post.deleteOne()

    res.json({ msg: "Post deleted" })
  } catch (err) {
    console.error("Error deleting post:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Like/unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Check if post is already liked by this user
    const likeIndex = post.likes.findIndex((like) => like.user.toString() === req.user.id)

    if (likeIndex === -1) {
      // Not liked, so add like
      post.likes.push({ user: req.user.id })
      post.likeCount = post.likes.length
      await post.save()

      // Notify post author if it's not their own post
      if (post.user.toString() !== req.user.id) {
        try {
          const notificationController = require("./notificationController")
          const notificationData = {
            recipient: post.user,
            type: "like",
            content: `${req.user.username} liked your post "${post.title}"`,
            relatedPost: post._id,
            sender: req.user.id,
          }
          await notificationController.createNotification(notificationData)
        } catch (notifError) {
          console.error("Error creating like notification:", notifError)
        }
      }

      return res.json({ liked: true, likeCount: post.likeCount })
    } else {
      // Already liked, so remove like
      post.likes.splice(likeIndex, 1)
      post.likeCount = post.likes.length
      await post.save()
      return res.json({ liked: false, likeCount: post.likeCount })
    }
  } catch (err) {
    console.error("Error toggling like:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Check if a post is liked by current user
// @route   GET /api/posts/:id/like
// @access  Private
const checkPostLiked = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    const liked = post.likes.some((like) => like.user.toString() === req.user.id)
    res.json({ liked, likeCount: post.likeCount })
  } catch (err) {
    console.error("Error checking like status:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
const getTrendingPosts = async (req, res) => {
  try {
    // Get posts from the last 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Find approved posts, sort by engagement (likes + comments + views)
    const posts = await Post.find({
      status: "approved",
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ likeCount: -1, commentCount: -1, views: -1 })
      .limit(10)
      .populate("user", ["username", "avatar"])
      .populate({
        path: "comments",
        select: "_id",
      })

    res.json(posts)
  } catch (err) {
    console.error("Error fetching trending posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Like or unlike a post
const likePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" })
  }

  try {
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Only allow interactions with approved posts
    if (post.status !== "approved") {
      return res.status(403).json({ msg: "Cannot interact with posts that are not approved" })
    }

    // Check if the user is liking their own post - don't create notification in this case
    const isOwnPost = post.user.toString() === userId

    // Check if the user already liked the post
    const alreadyLiked = post.likedBy.includes(userId)

    if (alreadyLiked) {
      post.likes--
      post.likedBy.pull(userId)
    } else {
      if (post.dislikedBy.includes(userId)) {
        post.dislikes--
        post.dislikedBy.pull(userId)
      }
      post.likes++
      post.likedBy.push(userId)

      // Create a notification for the post owner if it's not their own post
      if (!isOwnPost) {
        // Import the notification controller
        const notificationController = require("./notificationController")

        // Get the username of the person who liked the post
        const User = require("../models/User")
        const liker = await User.findById(userId).select("username")

        // Create notification data
        const notificationData = {
          recipient: post.user,
          sender: userId,
          type: "like",
          content: `${liker.username} liked your post "${post.title}"`,
          relatedPost: post._id,
        }

        try {
          // Create the notification with explicit error handling
          console.log("Creating like notification:", notificationData)
          await notificationController.createNotification(notificationData)
          console.log("Like notification created successfully")
        } catch (notifError) {
          console.error("Error creating like notification:", notifError)
          // Continue execution even if notification creation fails
        }
      }
    }

    await post.save()

    // Re-fetch the updated post with populated user
    const updatedPost = await Post.findById(post._id).populate("user", ["username"]).populate({
      path: "comments",
      select: "_id",
    })

    const io = req.app.get("io")
    if (io) {
      io.emit("postReaction", {
        postId: post._id,
        likes: post.likes,
        dislikes: post.dislikes,
      })
    }

    res.json(updatedPost)
  } catch (err) {
    console.error("Error in likePost:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Dislike or undislike a post
const dislikePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" })
  }

  try {
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Only allow interactions with approved posts
    if (post.status !== "approved") {
      return res.status(403).json({ msg: "Cannot interact with posts that are not approved" })
    }

    // Check if the user is disliking their own post - don't create notification in this case
    const isOwnPost = post.user.toString() === userId

    // Check if the user already disliked the post
    const alreadyDisliked = post.dislikedBy.includes(userId)

    if (alreadyDisliked) {
      post.dislikes--
      post.dislikedBy.pull(userId)
    } else {
      if (post.likedBy.includes(userId)) {
        post.likes--
        post.likedBy.pull(userId)
      }
      post.dislikes++
      post.dislikedBy.push(userId)

      // Create a notification for the post owner if it's not their own post
      if (!isOwnPost) {
        // Import the notification controller
        const notificationController = require("./notificationController")

        // Get the username of the person who disliked the post
        const User = require("../models/User")
        const disliker = await User.findById(userId).select("username")

        // Create notification data
        const notificationData = {
          recipient: post.user,
          sender: userId,
          type: "like", // Using 'like' type for dislikes too, but with different content
          content: `${disliker.username} disliked your post "${post.title}"`,
          relatedPost: post._id,
        }

        // Create the notification
        await notificationController.createNotification(notificationData)
      }
    }

    await post.save()

    // Re-fetch the updated post with populated user
    const updatedPost = await Post.findById(post._id).populate("user", ["username"]).populate({
      path: "comments",
      select: "_id",
    })

    const io = req.app.get("io")
    if (io) {
      io.emit("postReaction", {
        postId: post._id,
        likes: post.likes,
        dislikes: post.dislikes,
      })
    }

    res.json(updatedPost)
  } catch (err) {
    console.error("Error in dislikePost:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  getUserPosts,
  deletePost,
  updatePost,
  likePost,
  dislikePost,
  toggleLikePost,
  checkPostLiked,
  getFeedPosts,
  getTrendingPosts,
}
