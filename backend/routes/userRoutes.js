const express = require("express");
const { getUserProfile } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// Route to get user profile
router.get("/profile", authMiddleware, getUserProfile);

// Route to update user categories (after the user selects categories)
router.put("/:id/categories", authMiddleware, async (req, res) => {
  const { categories } = req.body;

  // Validate that at least one category is selected
  if (!categories || categories.length === 0) {
    return res.status(400).json({ msg: "At least one category must be selected" });
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

module.exports = router;
