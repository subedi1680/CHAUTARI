const express = require("express")
const router = express.Router()
const reportController = require("../controllers/reportController")
const auth = require("../middlewares/authMiddleware")
const { adminAuth } = require("../middlewares/adminMiddleware")

// User routes
router.post("/", auth, reportController.createReport)

// Admin routes
router.get("/", adminAuth, reportController.getAllReports)
router.get("/count", adminAuth, reportController.getReportCount)
router.put("/:id", adminAuth, reportController.updateReportStatus)

module.exports = router
