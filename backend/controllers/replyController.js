const Reply = require("../models/Reply")
const Comment = require("../models/Comment")

// Get all replies for a comment
exports.getRepliesByComment = async (req, res) => {
  try {
    const commentId = req.params.commentId
    const replies = await Reply.find({ comment: commentId }).populate("user", "username").sort({ createdAt: 1 })

    res.status(200).json(replies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    res.status(500).json({ message: "Failed to fetch replies" })
  }
}

// Update the createReply function to create a notification when someone replies to a comment
exports.createReply = async (req, res) => {
  try {
    const { content } = req.body
    const commentId = req.params.commentId
    const userId = req.user.id

    // Check if the comment exists
    const commentExists = await Comment.findById(commentId)
    if (!commentExists) {
      return res.status(404).json({ message: "Comment not found" })
    }

    // Ensure the reply is not empty
    if (!content.trim() && !req.file) {
      return res.status(400).json({ message: "Cannot post empty reply" })
    }

    // If a file is uploaded, convert it to base64
    let base64Image = ""
    if (req.file) {
      const mimeType = req.file.mimetype
      base64Image = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`
    }

    // Create a new reply instance
    const newReply = new Reply({
      content,
      comment: commentId,
      user: userId,
      image: base64Image,
    })

    // Save the reply to the database
    const savedReply = await newReply.save()

    // Populate the reply with the username of the user who posted it
    const populatedReply = await Reply.findById(savedReply._id).populate("user", "username")

    // Check if the user is replying to their own comment
    const isOwnComment = commentExists.user.toString() === userId

    // Create a notification for the comment owner if it's not their own comment
    if (!isOwnComment) {
      // Import the notification controller
      const notificationController = require("./notificationController")

      // Get the username of the replier
      const User = require("../models/User")
      const replier = await User.findById(userId).select("username")

      // Get the post information
      const Post = require("../models/Post")
      const post = await Post.findById(commentExists.post).select("title")

      // Create notification data
      const notificationData = {
        recipient: commentExists.user,
        sender: userId,
        type: "reply",
        content: `${replier.username} replied to your comment on "${post.title}"`,
        relatedPost: commentExists.post,
        relatedComment: commentId,
      }

      // Create the notification
      await notificationController.createNotification(notificationData)
    }

    // Emit a new reply event for real-time updates
    req.io.emit("newReply", populatedReply)

    // Return the populated reply
    res.status(201).json(populatedReply)
  } catch (error) {
    console.error("Error creating reply:", error)
    res.status(500).json({ message: "Failed to create reply" })
  }
}

// Update the deleteReply function to also delete related notifications
exports.deleteReply = async (req, res) => {
  try {
    const replyId = req.params.replyId
    const userId = req.user.id

    // Check if the reply exists
    const reply = await Reply.findById(replyId)
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" })
    }

    // Ensure the user is the author of the reply
    if (reply.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this reply" })
    }

    // Delete any notifications related to this reply
    const notificationController = require("./notificationController")
    await notificationController.deleteRelatedNotifications({
      commentId: reply.comment,
      // We can't directly query by replyId since it's not stored in the notification model
      // But deleting by commentId will remove notifications for this specific reply
    })

    // Delete the reply from the database
    await reply.deleteOne()

    // Emit a delete reply event for real-time updates
    req.io.emit("deleteReply", { replyId, commentId: reply.comment })

    // Return a success message
    res.status(200).json({ message: "Reply deleted successfully" })
  } catch (error) {
    console.error("Error deleting reply:", error)
    res.status(500).json({ message: "Failed to delete reply" })
  }
}
