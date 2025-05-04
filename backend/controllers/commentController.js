const Comment = require("../models/Comment")
const Post = require("../models/Post")
const User = require("../models/User")
const mongoose = require("mongoose")

// Helper function to update user's comment count
const updateUserCommentCount = async (userId) => {
  try {
    // Count all comments by this user
    const commentCount = await Comment.countDocuments({ user: userId })

    // Update the user's commentCount field
    await User.findByIdAndUpdate(userId, { commentCount: commentCount })

    return commentCount
  } catch (error) {
    console.error("Error updating user comment count:", error)
    throw error
  }
}

// Enhance the createComment function to ensure notifications are created properly
const createComment = async (req, res) => {
  try {
    // Get post ID from either params or body
    const postId = req.params.postId || req.body.postId

    if (!postId) {
      return res.status(400).json({ msg: "Post ID is required" })
    }

    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ msg: "Post not found" })
    }

    // Get comment content from body
    const { content } = req.body

    // Check if there's either content or an image
    if (!content && !req.file) {
      return res.status(400).json({ msg: "Comment must have either text or an image" })
    }

    // Create new comment
    const newComment = new Comment({
      content: content || "",
      post: postId,
      user: req.user.id,
      image: req.file ? req.file.buffer.toString("base64") : null,
    })

    // Save comment
    await newComment.save()

    // Update post with new comment
    post.comments.push(newComment._id)
    await post.save()

    // Update user's comment count
    const updatedCommentCount = await updateUserCommentCount(req.user.id)

    // Populate user data for the response
    const populatedComment = await Comment.findById(newComment._id).populate("user", ["username", "avatar"])

    // Create notification for post owner if it's not their own post
    if (post.user.toString() !== req.user.id) {
      try {
        // Get notification controller
        const notificationController = require("./notificationController")

        // Get username of commenter
        const commenter = await User.findById(req.user.id).select("username")

        // Create notification data
        const notificationData = {
          recipient: post.user,
          sender: req.user.id,
          type: "comment",
          content: `${commenter.username} commented on your post "${post.title}"`,
          relatedPost: post._id,
          relatedComment: newComment._id,
        }

        console.log("Creating comment notification:", notificationData)

        // Create notification
        await notificationController.createNotification(notificationData)
        console.log("Comment notification created successfully")
      } catch (notifError) {
        console.error("Error creating comment notification:", notifError)
        // Continue execution even if notification creation fails
      }
    }

    // Emit socket event for new comment
    if (req.io) {
      req.io.emit("newComment", {
        postId,
        comment: populatedComment,
        commentCount: updatedCommentCount,
      })
    }

    res.status(201).json(populatedComment)
  } catch (err) {
    console.error("Error creating comment:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get all comments for a post
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params

    // Validate postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: "Invalid post ID" })
    }

    const comments = await Comment.find({ post: postId })
      .populate("user", ["username", "avatar"]) // Include avatar in population
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (err) {
    console.error("Error fetching comments:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid comment ID" })
    }

    const comment = await Comment.findById(id)

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" })
    }

    // Check if user is authorized to delete
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    // Delete all replies to this comment
    const Reply = require("../models/Reply")
    await Reply.deleteMany({ comment: id })

    // Delete related notifications
    const notificationController = require("./notificationController")
    await notificationController.deleteRelatedNotifications({ commentId: id })

    await comment.deleteOne()

    // Update user's comment count after deletion
    const updatedCommentCount = await updateUserCommentCount(req.user.id)

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("deleteComment", {
        commentId: id,
        postId: comment.post,
        commentCount: updatedCommentCount,
      })
    }

    res.json({ msg: "Comment deleted" })
  } catch (err) {
    console.error("Error deleting comment:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid comment ID" })
    }

    if (!content) {
      return res.status(400).json({ msg: "Content is required" })
    }

    const comment = await Comment.findById(id)

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" })
    }

    // Check if user is authorized to update
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    comment.content = content
    comment.edited = true
    comment.editedAt = Date.now()

    await comment.save()

    // Populate user data including avatar
    const updatedComment = await Comment.findById(id).populate("user", ["username", "avatar"])

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("updateComment", {
        comment: updatedComment,
        postId: comment.post,
      })
    }

    res.json(updatedComment)
  } catch (err) {
    console.error("Error updating comment:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get all comments by a user
exports.getCommentsByUser = async (req, res) => {
  try {
    // Get the count of all comments
    const totalComments = await Comment.countDocuments({ user: req.user.id })

    // Update the user's commentCount field to ensure it's in sync
    await User.findByIdAndUpdate(req.user.id, { commentCount: totalComments })

    // Get the comments with populated data
    const comments = await Comment.find({ user: req.user.id })
      .populate("post", ["title", "category"])
      .populate("user", ["username", "avatar"])
      .sort({ createdAt: -1 })

    // Return both the count and the comments
    res.json({
      count: totalComments,
      comments: comments,
    })
  } catch (err) {
    console.error("Error fetching user comments:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

exports.createComment = createComment
