const express = require("express")
const {
  createPost,
  getPosts,
  getPostById,
  getUserPosts,
  deletePost,
  updatePost,
  likePost,
  dislikePost,
} = require("../controllers/postController")
const authMiddleware = require("../middlewares/authMiddleware")
const multer = require("multer")

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post("/", authMiddleware, upload.single("coverImage"), createPost)
router.get("/", getPosts)
router.get("/user", authMiddleware, getUserPosts)
router.get("/:id", getPostById)
router.put("/:id", authMiddleware, upload.single("coverImage"), updatePost)
router.delete("/:id", authMiddleware, deletePost)

// Reaction endpoints
router.post("/:id/like", authMiddleware, likePost)
router.post("/:id/dislike", authMiddleware, dislikePost)

module.exports = router
