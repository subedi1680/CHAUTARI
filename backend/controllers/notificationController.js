const Notification = require("../models/Notification")
const User = require("../models/User")

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    console.log("Fetching notifications for user:", req.user.id)
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(50)

    console.log(`Found ${notifications.length} notifications`)
    res.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" })
    }

    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" })
    }

    notification.read = true
    await notification.save()

    res.json({ msg: "Notification marked as read" })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true })

    res.json({ msg: "All notifications marked as read" })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" })
    }

    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" })
    }

    await notification.deleteOne()

    res.json({ msg: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { email, comments, likes, replies } = req.body

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Update notification preferences
    user.notificationPreferences = {
      email: email !== undefined ? email : user.notificationPreferences?.email || true,
      comments: comments !== undefined ? comments : user.notificationPreferences?.comments || true,
      likes: likes !== undefined ? likes : user.notificationPreferences?.likes || true,
      replies: replies !== undefined ? replies : user.notificationPreferences?.replies || true,
    }

    await user.save()

    res.json({
      msg: "Notification preferences updated",
      preferences: user.notificationPreferences,
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Create a notification
exports.createNotification = async (notificationData) => {
  try {
    console.log("Creating notification with data:", notificationData)

    // Validate required fields
    if (!notificationData.recipient || !notificationData.type || !notificationData.content) {
      console.error("Missing required notification fields")
      throw new Error("Missing required notification fields")
    }

    // Create notification
    const notification = new Notification({
      recipient: notificationData.recipient,
      sender: notificationData.sender,
      type: notificationData.type,
      content: notificationData.content,
      relatedPost: notificationData.relatedPost,
      relatedComment: notificationData.relatedComment,
      relatedReply: notificationData.relatedReply,
    })

    // Save notification
    await notification.save()
    console.log("Notification saved to database:", notification._id)

    // Emit socket event if io is available
    const io = global.io
    if (io) {
      console.log("Emitting socket event for notification to user:", notificationData.recipient)
      io.to(notificationData.recipient.toString()).emit("newNotification", notification)
    } else {
      console.log("Socket.io not available, notification will be shown on next login")
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Delete notifications related to specific content
exports.deleteRelatedNotifications = async (options) => {
  try {
    const query = {}

    if (options.postId) {
      query.relatedPost = options.postId
    }

    if (options.commentId) {
      query.relatedComment = options.commentId
    }

    if (Object.keys(query).length === 0) {
      return
    }

    const result = await Notification.deleteMany(query)
    console.log(`Deleted ${result.deletedCount} notifications related to content`)
  } catch (error) {
    console.error("Error deleting related notifications:", error)
  }
}

module.exports = {
  getUserNotifications: exports.getUserNotifications,
  markAsRead: exports.markAsRead,
  markAllAsRead: exports.markAllAsRead,
  deleteNotification: exports.deleteNotification,
  updateNotificationPreferences: exports.updateNotificationPreferences,
  createNotification: exports.createNotification,
  deleteRelatedNotifications: exports.deleteRelatedNotifications,
}
