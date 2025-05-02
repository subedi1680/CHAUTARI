const express = require("express")
const router = express.Router()
const replyController = require("../controllers/replyController")
const authenticate = require("../middlewares/authMiddleware")
const upload = require("../middlewares/upload")
const multer = require("multer")

// Multer error handler
const handleMulterError = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      console.error("Multer error:", err)
      return res.status(400).json({ message: err.message || "File upload error" })
    }
    next()
  })
}

// Routes
router.get("/comments/:commentId/replies", replyController.getRepliesByComment)
router.post("/comments/:commentId/replies", authenticate, handleMulterError, replyController.createReply)
router.delete("/replies/:replyId", authenticate, replyController.deleteReply)

module.exports = router
