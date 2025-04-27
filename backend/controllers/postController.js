const mongoose = require("mongoose");
const Post = require("../models/Post");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a new post
const createPost = async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ msg: "Title, category, and content are required" });
  }

  try {
    const coverImage = req.file ? req.file.buffer.toString("base64") : null;

    const post = new Post({
      title,
      content,
      category,
      coverImage,
      user: req.user.id,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error("Post creation error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get all posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", ["username"])
      .populate({
        path: "comments",
        select: "_id",
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Failed to fetch posts:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Get a single post by ID
const getPostById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    const post = await Post.findById(id)
      .populate("user", ["username"])
      .populate({
        path: "comments",
        select: "_id",
      });

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error("Failed to fetch post:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Update a post
const updatePost = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    let post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to edit this post" });
    }

    if (req.body.title) post.title = req.body.title;
    if (req.body.content) post.content = req.body.content;
    if (req.body.category) post.category = req.body.category;
    if (req.file) {
      post.coverImage = req.file.buffer.toString("base64");
    }

    post.edited = true;
    post.editedAt = Date.now();

    await post.save();
    res.json({ msg: "Post updated successfully", post });
  } catch (err) {
    console.error("Error updating post:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Like or unlike a post
const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.likedBy.includes(userId)) {
      post.likes--;
      post.likedBy.pull(userId);
    } else {
      if (post.dislikedBy.includes(userId)) {
        post.dislikes--;
        post.dislikedBy.pull(userId);
      }
      post.likes++;
      post.likedBy.push(userId);
    }

    await post.save();

    // Re-fetch the updated post with populated user
    const updatedPost = await Post.findById(post._id)
      .populate("user", ["username"])
      .populate({
        path: "comments",
        select: "_id",
      });

    const io = req.app.get("io");
    if (io) {
      io.emit("postReaction", {
        postId: post._id,
        likes: post.likes,
        dislikes: post.dislikes,
      });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("Error in likePost:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Dislike or undislike a post
const dislikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.dislikedBy.includes(userId)) {
      post.dislikes--;
      post.dislikedBy.pull(userId);
    } else {
      if (post.likedBy.includes(userId)) {
        post.likes--;
        post.likedBy.pull(userId);
      }
      post.dislikes++;
      post.dislikedBy.push(userId);
    }

    await post.save();

    // Re-fetch the updated post with populated user
    const updatedPost = await Post.findById(post._id)
      .populate("user", ["username"])
      .populate({
        path: "comments",
        select: "_id",
      });

    const io = req.app.get("io");
    if (io) {
      io.emit("postReaction", {
        postId: post._id,
        likes: post.likes,
        dislikes: post.dislikes,
      });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("Error in dislikePost:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  updatePost,
  likePost,
  dislikePost,
};
