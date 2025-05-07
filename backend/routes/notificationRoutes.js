const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")
const authMiddleware = require("../middlewares/authMiddleware")

// Get all notifications for the authenticated user
router.get("/", authMiddleware, notificationController.getUserNotifications)

// Mark a notification as read
router.put("/:id/read", authMiddleware, notificationController.markNotificationRead)

// Mark all notifications as read
router.put("/read-all", authMiddleware, notificationController.markAllNotificationsRead)

// Delete a notification
router.delete("/:id", authMiddleware, notificationController.deleteNotification)

// If you have a preferences update route, make sure it's implemented
// Uncomment the following line only if `updateNotificationPreferences` exists in your controller
// router.put("/preferences", authMiddleware, notificationController.updateNotificationPreferences)

module.exports = router
