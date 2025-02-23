const express = require("express");
const {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  updatePost,
} = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("coverImage"), createPost);
router.get("/", getPosts);
router.get("/:id", getPostById);
router.put("/:id", authMiddleware, upload.single("coverImage"), updatePost);
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
