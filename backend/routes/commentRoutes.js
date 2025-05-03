const express = require("express")
const router = express.Router()
const commentController = require("../controllers/commentController")
const authenticate = require("../middlewares/authMiddleware")
const upload = require("../middlewares/upload")
const multer = require("multer")

// Middleware to handle multer errors
const handleMulterError = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      console.error("Multer error:", err)
      return res.status(400).json({ message: err.message || "File upload error" })
    }
    next()
  })
}

// Get all comments for a post
router.get("/posts/:postId/comments", commentController.getCommentsByPost)

// Create a new comment (with authentication and file handling)
router.post("/posts/:postId/comments", authenticate, handleMulterError, commentController.createComment)

// Delete a comment
router.delete("/comments/:id", authenticate, commentController.deleteComment)

module.exports = router
