const mongoose = require("mongoose")
const Post = require("../models/Post")
const User = require("../models/User") // Import User model

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// Create a new post
const createPost = async (req, res) => {
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

    const { title, content, category } = req.body

    if (!title || !content || !category) {
      return res.status(400).json({ msg: "Title, category, and content are required" })
    }

    try {
      const coverImage = req.file ? req.file.buffer.toString("base64") : null

      const post = new Post({
        title,
        content,
        category,
        coverImage,
        user: req.user.id,
        status: "pending", // Set status to pending by default
      })

      await post.save()

      // Notify admins about new post (you could implement this)

      res.status(201).json(post)
    } catch (err) {
      console.error("Post creation error:", err.message)
      res.status(500).json({ msg: "Server Error" })
    }
  } catch (err) {
    console.error("Error checking ban status:", err.message)
    return res.status(500).json({ msg: "Server Error" })
  }
}

// Modify the getPosts function to only return approved posts for regular users
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "approved" })
      .populate("user", ["username", "avatar"]) // Add avatar to the populated fields
      .populate({
        path: "comments",
        select: "_id",
      })
      .sort({ createdAt: -1 })

    res.json(posts)
  } catch (err) {
    console.error("Failed to fetch posts:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Modify the getPostById function to check post status
const getPostById = async (req, res) => {
  const { id } = req.params

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" })
  }

  try {
    const post = await Post.findById(id)
      .populate("user", ["username", "avatar"]) // Add avatar to the populated fields
      .populate({
        path: "comments",
        select: "_id",
      })

    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // If post is not approved, only allow the author or admins to view it
    if (post.status !== "approved") {
      // Check if the request includes user info (authenticated)
      const userId = req.user ? req.user.id : null

      // If not the author, return error
      if (!userId || post.user._id.toString() !== userId) {
        return res.status(403).json({
          msg: "This post is not yet approved and can only be viewed by the author",
          status: post.status,
        })
      }
    }

    res.json(post)
  } catch (err) {
    console.error("Failed to fetch post:", err.message)
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

// Delete a post
const deletePost = async (req, res) => {
  const { id } = req.params

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" })
  }

  try {
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to delete this post" })
    }

    // Delete all comments associated with this post
    const Comment = require("../models/Comment")
    await Comment.deleteMany({ post: id })

    // Delete all replies to comments on this post
    const Reply = require("../models/Reply")
    const comments = await Comment.find({ post: id }).select("_id")
    const commentIds = comments.map((comment) => comment._id)
    await Reply.deleteMany({ comment: { $in: commentIds } })

    // Delete all notifications related to this post
    const notificationController = require("./notificationController")
    await notificationController.deleteRelatedNotifications({ postId: id })

    // Delete the post
    await post.deleteOne()

    // Emit event to inform clients
    if (req.io) {
      req.io.emit("postDeleted", { postId: id })
    }

    res.json({ msg: "Post deleted successfully" })
  } catch (err) {
    console.error("Error deleting post:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update a post
const updatePost = async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" })
  }

  try {
    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to edit this post" })
    }

    if (req.body.title) post.title = req.body.title
    if (req.body.content) post.content = req.body.content
    if (req.body.category) post.category = req.body.category
    if (req.file) {
      post.coverImage = req.file.buffer.toString("base64")
    }

    post.edited = true
    post.editedAt = Date.now()

    // If post was already approved, set it back to pending for re-review
    if (post.status === "approved") {
      post.status = "pending"
    }

    await post.save()
    res.json({ msg: "Post updated successfully", post })
  } catch (err) {
    console.error("Error updating post:", err.message)
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
}
