const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const reportController = require("../controllers/reportController")
const { adminAuth, superAdminAuth } = require("../middlewares/adminMiddleware")

// Public routes
router.post("/send-otp", adminController.sendAdminOtp)
router.post("/verify-otp", adminController.verifyAdminOtp)

// Protected routes - require admin authentication
router.get("/stats", adminAuth, adminController.getAdminStats)
router.get("/posts/pending", adminAuth, adminController.getPendingPosts)
router.get("/posts", adminAuth, adminController.getAllPosts)
router.get("/posts/:id", adminAuth, adminController.getPostById)
router.put("/posts/:id/approve", adminAuth, adminController.approvePost)
router.put("/posts/:id/reject", adminAuth, adminController.rejectPost)

// Report routes
router.get("/reports", adminAuth, reportController.getAllReports)
router.get("/reports/count", adminAuth, reportController.getReportCount)
router.put("/reports/:id", adminAuth, reportController.updateReportStatus)

// Super admin only routes
router.post("/add", adminAuth, superAdminAuth, adminController.addAdmin)
router.delete("/:id", adminAuth, superAdminAuth, adminController.removeAdmin)
router.get("/all", adminAuth, superAdminAuth, adminController.getAllAdmins)

module.exports = router
