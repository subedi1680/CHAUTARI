const Notification = require("../models/Notification")

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username")
      .populate("relatedPost", "title")
      .sort({ createdAt: -1 })
      .limit(50)

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

    const user = await require("../models/User").findById(req.user.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Update notification preferences
    user.notificationPreferences = {
      email: email !== undefined ? email : user.notificationPreferences.email,
      comments: comments !== undefined ? comments : user.notificationPreferences.comments,
      likes: likes !== undefined ? likes : user.notificationPreferences.likes,
      replies: replies !== undefined ? replies : user.notificationPreferences.replies,
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

// Update the createNotification function to be more efficient
exports.createNotification = async (data) => {
  try {
    // Check if user has notification preferences disabled for this type
    const User = require("../models/User")
    const recipient = await User.findById(data.recipient).select("notificationPreferences")

    if (!recipient) {
      console.error("Recipient user not found")
      return null
    }

    // Check notification preferences - quick check without unnecessary processing
    if (
      (data.type === "comment" && recipient.notificationPreferences?.comments === false) ||
      (data.type === "like" && recipient.notificationPreferences?.likes === false) ||
      (data.type === "reply" && recipient.notificationPreferences?.replies === false)
    ) {
      return null
    }

    // Create notification object
    const notification = new Notification(data)

    // Emit socket event immediately before saving to database
    // This makes notifications appear faster in the UI
    if (global.io) {
      global.io.to(data.recipient.toString()).emit("newNotification", {
        ...data,
        _id: notification._id,
        createdAt: new Date(),
        read: false,
      })
    }

    // Save to database asynchronously
    await notification.save()

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

// Add a new function to delete notifications related to specific content
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
