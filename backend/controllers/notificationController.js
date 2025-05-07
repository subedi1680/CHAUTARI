const Notification = require("../models/Notification")

// @desc    Create a new notification
// @route   Internal function, not exposed as API
// @access  Internal
const createNotification = async (notificationData) => {
  try {
    const { recipient, type, content, relatedPost, sender } = notificationData

    const newNotification = new Notification({
      recipient,
      type,
      content,
      relatedPost,
      sender,
    })

    const notification = await newNotification.save()

    // Emit socket event if io is available
    const io = global.io
    if (io) {
      io.to(recipient.toString()).emit("newNotification", notification)
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar")
      .populate("relatedPost", "title")

    res.json(notifications)
  } catch (err) {
    console.error("Error fetching notifications:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" })
    }

    // Check if user owns this notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" })
    }

    notification.read = true
    await notification.save()

    res.json(notification)
  } catch (err) {
    console.error("Error marking notification as read:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } })

    res.json({ msg: "All notifications marked as read" })
  } catch (err) {
    console.error("Error marking all notifications as read:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" })
    }

    // Check if user owns this notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" })
    }

    await notification.deleteOne()

    res.json({ msg: "Notification deleted" })
  } catch (err) {
    console.error("Error deleting notification:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false })
    res.json({ count })
  } catch (err) {
    console.error("Error getting unread count:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
}
