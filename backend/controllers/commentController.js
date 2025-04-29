const Comment = require("../models/Comment")
const Post = require("../models/Post")

// Get all comments for a post
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId
    const comments = await Comment.find({ post: postId }).populate("user", "username").sort({ createdAt: -1 })

    res.status(200).json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ message: "Failed to fetch comments" })
  }
}

// Update the createComment function to create a notification when someone comments on a post
exports.createComment = async (req, res) => {
  try {
    const { content } = req.body
    const postId = req.params.postId
    const userId = req.user.id

    const postExists = await Post.findById(postId)
    if (!postExists) {
      return res.status(404).json({ message: "Post not found" })
    }

    if (!content.trim() && !req.file) {
      return res.status(400).json({ message: "Cannot post empty comment" })
    }

    let base64Image = ""
    if (req.file) {
      const mimeType = req.file.mimetype
      base64Image = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`
    }

    const newComment = new Comment({
      content,
      post: postId,
      user: userId,
      image: base64Image,
    })

    const savedComment = await newComment.save()

    // Add the comment to the post's comments array and update the post's comment count
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: savedComment._id },
      $inc: { commentCount: 1 },
    })

    const populatedComment = await Comment.findById(savedComment._id).populate("user", "username")

    // Check if the user is commenting on their own post
    const isOwnPost = postExists.user.toString() === userId

    // Create a notification for the post owner if it's not their own post
    if (!isOwnPost) {
      // Import the notification controller
      const notificationController = require("./notificationController")

      // Get the username of the commenter
      const User = require("../models/User")
      const commenter = await User.findById(userId).select("username")

      // Create notification data
      const notificationData = {
        recipient: postExists.user,
        sender: userId,
        type: "comment",
        content: `${commenter.username} commented on your post "${postExists.title}"`,
        relatedPost: postId,
        relatedComment: savedComment._id,
      }

      // Create the notification
      await notificationController.createNotification(notificationData)
    }

    req.io.emit("newComment", populatedComment)

    res.status(201).json(populatedComment)
  } catch (error) {
    console.error("Error creating comment:", error)
    res.status(500).json({ message: "Failed to create comment" })
  }
}

// Update the deleteComment function to also delete related notifications
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId
    const userId = req.user.id

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" })
    }

    const postId = comment.post

    // Delete all replies to this comment
    const Reply = require("../models/Reply")
    await Reply.deleteMany({ comment: commentId })

    // Delete all notifications related to this comment
    const notificationController = require("./notificationController")
    await notificationController.deleteRelatedNotifications({ commentId })

    // Delete the comment
    await comment.deleteOne()

    // Remove the comment from the post's comment array and update the comment count
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
      $inc: { commentCount: -1 },
    })

    // Emit event to inform clients
    req.io.emit("deleteComment", { commentId, postId })

    res.status(200).json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Failed to delete comment" })
  }
}
