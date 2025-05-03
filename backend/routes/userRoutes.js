const express = require("express");
const {
  getUserProfile,
  getUserActivity,
  updateUserAvatar,
  removeUserAvatar,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Route to get user profile
router.get("/profile", authMiddleware, getUserProfile);

// Route to get user activity log
router.get("/activity", authMiddleware, getUserActivity);

// Add a dedicated route for avatar updates
router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  updateUserAvatar
);

// Add a route for avatar removal
router.delete("/avatar", authMiddleware, removeUserAvatar);

// Route to update user categories (after the user selects categories)
router.put("/:id/categories", authMiddleware, async (req, res) => {
  const { categories } = req.body;

  // Validate that at least one category is selected
  if (!categories || categories.length === 0) {
    return res
      .status(400)
      .json({ msg: "At least one category must be selected" });
  }

  try {
    const user = await User.findById(req.params.id);

    // Ensure that the user exists
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update the categories for the user
    user.categories = categories;
    user.categorySetupCompleted = true;
    await user.save();

    res.status(200).json({ msg: "Categories updated successfully" });
  } catch (error) {
    console.error("Error updating categories:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Update the profile update route to include avatar
router.put(
  "/:id/profile",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    // Ensure the user can only update their own profile
    if (req.params.id !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to update this profile" });
    }

    const { bio } = req.body;

    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Update fields if provided
      if (bio !== undefined) user.bio = bio;

      // Handle avatar upload
      if (req.file) {
        const avatarBase64 = `data:${
          req.file.mimetype
        };base64,${req.file.buffer.toString("base64")}`;
        user.avatar = avatarBase64;
      }

      await user.save();

      res.status(200).json({
        msg: "Profile updated successfully",
        user: {
          username: user.username,
          bio: user.bio,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

// Route to update user password
router.put("/:id/password", authMiddleware, async (req, res) => {
  // Ensure the user can only update their own password
  if (req.params.id !== req.user.id) {
    return res
      .status(403)
      .json({ msg: "Not authorized to update this password" });
  }

  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Current password and new password are required" });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Add a route to download user data
router.get("/:id/download-data", authMiddleware, async (req, res) => {
  // Ensure the user can only download their own data
  if (req.params.id !== req.user.id) {
    return res
      .status(403)
      .json({ msg: "Not authorized to download this data" });
  }

  try {
    // Get user profile
    const user = await User.findById(req.params.id).select("-password");

    // Get user posts
    const Post = require("../models/Post");
    const posts = await Post.find({ user: req.params.id });

    // Get user comments
    const Comment = require("../models/Comment");
    const comments = await Comment.find({ user: req.params.id });

    // Get user replies
    const Reply = require("../models/Reply");
    const replies = await Reply.find({ user: req.params.id });

    // Compile all data
    const userData = {
      profile: user,
      posts,
      comments,
      replies,
      exportDate: new Date(),
    };

    res.json(userData);
  } catch (error) {
    console.error("Error downloading user data:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Add a route to delete user account
router.delete("/:id", authMiddleware, async (req, res) => {
  // Ensure the user can only delete their own account
  if (req.params.id !== req.user.id) {
    return res
      .status(403)
      .json({ msg: "Not authorized to delete this account" });
  }

  try {
    // Verify password
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ msg: "Password is required to delete account" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Password is incorrect" });
    }

    // Delete user's posts
    const Post = require("../models/Post");
    await Post.deleteMany({ user: req.params.id });

    // Delete user's comments
    const Comment = require("../models/Comment");
    await Comment.deleteMany({ user: req.params.id });

    // Delete user's replies
    const Reply = require("../models/Reply");
    await Reply.deleteMany({ user: req.params.id });

    // Delete user
    await user.deleteOne();

    res.json({ msg: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
