const mongoose = require("mongoose");
const Post = require("../models/Post");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res
      .status(400)
      .json({ msg: "Title, category, and content are required" });
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

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", ["username"])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Failed to fetch posts:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "Invalid Post ID" });
  }

  try {
    const post = await Post.findById(id).populate("user", ["username"]);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error("Failed to fetch post:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
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

// @desc    Update a post (Title, Content, Category, and Optional Image)
// @route   PUT /api/posts/:id
// @access  Private
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
    post.updatedAt = Date.now();

    await post.save();
    res.json({ msg: "Post updated successfully", post });
  } catch (err) {
    console.error("Error updating post:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = { createPost, getPosts, getPostById, deletePost, updatePost };
