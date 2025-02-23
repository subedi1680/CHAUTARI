const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, dateOfBirth, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res
        .status(400)
        .json({ msg: "User already exists with this email or username" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      dateOfBirth,
      password: hashedPassword,
    });

    await user.save();

    const payload = { user: { id: user.id, username: user.username } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username } });
      }
    );
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Login user with Username
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ msg: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid username or password" });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username } });
      }
    );
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = { registerUser, loginUser };
