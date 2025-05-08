const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")
const authMiddleware = require("../middlewares/authMiddleware")

// Get all notifications for the authenticated user
router.get("/", authMiddleware, notificationController.getUserNotifications)

// Mark a notification as read
router.put("/:id/read", authMiddleware, notificationController.markAsRead)

// Mark all notifications as read
router.put("/read-all", authMiddleware, notificationController.markAllAsRead)

// Delete a notification
router.delete("/:id", authMiddleware, notificationController.deleteNotification)

// Update notification preferences
router.put("/preferences", authMiddleware, notificationController.updateNotificationPreferences)

module.exports = router
