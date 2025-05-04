const express = require("express")
const router = express.Router()
const userManagementController = require("../controllers/userManagementController")
const { adminAuth } = require("../middlewares/adminMiddleware")

// All routes require admin authentication
router.use(adminAuth)

// Get user statistics - this needs to be BEFORE the /:id routes to avoid conflicts
router.get("/stats", userManagementController.getUserStats)

// Get user ban statistics
router.get("/ban-stats", userManagementController.getBanStats)

// Get all users with pagination and search
router.get("/", userManagementController.getAllUsers)

// Get user details including violation history
router.get("/:id", userManagementController.getUserDetails)

// Reset user's violation count
router.put("/:id/reset-violations", userManagementController.resetViolations)

// Ban a user
router.put("/:id/ban", userManagementController.banUser)

// Unban a user
router.put("/:id/unban", userManagementController.unbanUser)

// Delete a user account
router.delete("/:id", userManagementController.deleteUser)

module.exports = router
