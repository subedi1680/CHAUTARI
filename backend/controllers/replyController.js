const Reply = require("../models/Reply")
const Comment = require("../models/Comment")
const mongoose = require("mongoose")

// Create a new reply
exports.createReply = async (req, res) => {
  try {
    const { content, commentId } = req.body

    if (!content || !commentId) {
      return res.status(400).json({ msg: "Content and comment ID are required" })
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId).populate("user", "id")
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" })
    }

    // Get post ID from comment
    const postId = comment.post

    const reply = new Reply({
      content,
      comment: commentId,
      user: req.user.id,
    })

    await reply.save()

    // Populate user data including avatar
    const populatedReply = await Reply.findById(reply._id).populate("user", ["username", "avatar"])

    // Create notification for comment owner if it's not their own reply
    if (comment.user.toString() !== req.user.id) {
      const notificationController = require("./notificationController")
      const User = require("../models/User")
      const replier = await User.findById(req.user.id).select("username")

      const notificationData = {
        recipient: comment.user,
        sender: req.user.id,
        type: "reply",
        content: `${replier.username} replied to your comment`,
        relatedPost: postId,
        relatedComment: commentId,
      }

      await notificationController.createNotification(notificationData)
    }

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("newReply", {
        reply: populatedReply,
        commentId,
        postId,
      })
    }

    res.status(201).json(populatedReply)
  } catch (err) {
    console.error("Error creating reply:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get all replies for a comment
exports.getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params

    // Validate commentId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: "Invalid comment ID" })
    }

    const replies = await Reply.find({ comment: commentId })
      .populate("user", ["username", "avatar"]) // Include avatar in population
      .sort({ createdAt: 1 })

    res.json(replies)
  } catch (err) {
    console.error("Error fetching replies:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const { id } = req.params

    // Validate reply ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid reply ID" })
    }

    const reply = await Reply.findById(id)

    if (!reply) {
      return res.status(404).json({ msg: "Reply not found" })
    }

    // Check if user is authorized to delete
    if (reply.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    // Get comment ID for socket event
    const commentId = reply.comment

    // Delete related notifications
    const notificationController = require("./notificationController")
    await notificationController.deleteRelatedNotifications({ commentId })

    await reply.deleteOne()

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("deleteReply", {
        replyId: id,
        commentId,
      })
    }

    res.json({ msg: "Reply deleted" })
  } catch (err) {
    console.error("Error deleting reply:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update a reply
exports.updateReply = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    // Validate reply ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid reply ID" })
    }

    if (!content) {
      return res.status(400).json({ msg: "Content is required" })
    }

    const reply = await Reply.findById(id)

    if (!reply) {
      return res.status(404).json({ msg: "Reply not found" })
    }

    // Check if user is authorized to update
    if (reply.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" })
    }

    reply.content = content
    reply.edited = true
    reply.editedAt = Date.now()

    await reply.save()

    // Populate user data including avatar
    const updatedReply = await Reply.findById(id).populate("user", ["username", "avatar"])

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("updateReply", {
        reply: updatedReply,
        commentId: reply.comment,
      })
    }

    res.json(updatedReply)
  } catch (err) {
    console.error("Error updating reply:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}
