const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const nodemailer = require("nodemailer")

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map()

// Configure nodemailer with better error handling
const createTransporter = () => {
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("Email credentials are missing. Please check your environment variables.")
    return null
  }

  const service = process.env.EMAIL_SERVICE || "gmail"

  try {
    return nodemailer.createTransport({
      service: service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Helps with some email providers
      },
    })
  } catch (error) {
    console.error("Failed to create email transporter:", error)
    return null
  }
}

// Password validation function
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// @desc    Send OTP to user's email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  const { email, username, password } = req.body

  if (!email || !username || !password) {
    return res.status(400).json({ msg: "Email, username, and password are required" })
  }

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: "Email already registered. Please use a different email." })
      }
      if (existingUser.username === username) {
        return res.status(400).json({ msg: "Username already taken. Please choose a different username." })
      }
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      })
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      userData: { username, password }, // Store user data temporarily
    })

    // Create transporter for this request
    const transporter = createTransporter()
    if (!transporter) {
      return res.status(500).json({ msg: "Email service configuration error. Please contact support." })
    }

    // Send email with OTP
    const mailOptions = {
      from: `"CHAUTARI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for CHAUTARI Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to CHAUTARI!</h2>
          <p>Your One-Time Password (OTP) for registration is:</p>
          <h1 style="font-size: 32px; letter-spacing: 2px; color: #333; background: #f5f5f5; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <p>Thank you,<br>CHAUTARI Team</p>
        </div>
      `,
    }

    try {
      await transporter.sendMail(mailOptions)
      res.status(200).json({ msg: "OTP sent successfully" })
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      res.status(500).json({ msg: "Failed to send OTP email. Please try again later." })
    }
  } catch (err) {
    console.error("OTP sending error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ msg: "Email and OTP are required" })
  }

  try {
    // Check if OTP exists and is valid
    const otpData = otpStore.get(email)

    if (!otpData) {
      return res.status(400).json({ msg: "OTP expired or not found. Please request a new one." })
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ msg: "OTP has expired. Please request a new one." })
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." })
    }

    // OTP is valid, delete it from store
    otpStore.delete(email)

    res.status(200).json({ msg: "OTP verified successfully" })
  } catch (err) {
    console.error("OTP verification error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, dateOfBirth, password } = req.body

  try {
    // Double-check if user exists (in case someone registered with the same details while OTP was being verified)
    let user = await User.findOne({ $or: [{ email }, { username }] })

    if (user) {
      if (user.email === email) {
        return res.status(400).json({ msg: "Email already registered" })
      }
      if (user.username === username) {
        return res.status(400).json({ msg: "Username already taken" })
      }
    }

    // Validate password again as a security measure
    if (!validatePassword(password)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    user = new User({
      username,
      email,
      dateOfBirth,
      password: hashedPassword,
    })

    await user.save()

    const payload = { user: { id: user.id, username: user.username } }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err
      res.json({ token, user: { id: user.id, username: user.username } })
    })
  } catch (err) {
    console.error("Registration error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Login user with Username
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })

    if (!user) {
      return res.status(400).json({ msg: "Invalid username or password" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid username or password" })
    }

    // Update last login time
    user.lastLogin = Date.now()
    await user.save()

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        categorySetupCompleted: user.categorySetupCompleted,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          categorySetupCompleted: user.categorySetupCompleted,
        },
      })
    })
  } catch (err) {
    console.error("Login error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Verify user password for sensitive operations
// @route   POST /api/auth/verify-password
// @access  Private
const verifyPassword = async (req, res) => {
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ msg: "Password is required" })
  }

  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ msg: "Incorrect password" })
    }

    res.status(200).json({ msg: "Password verified successfully" })
  } catch (err) {
    console.error("Password verification error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ msg: "Email is required" })
  }

  try {
    // Check if user exists with this email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ msg: "No account found with this email" })
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      type: "reset", // Mark this as a reset password OTP
    })

    // Create transporter for this request
    const transporter = createTransporter()
    if (!transporter) {
      return res.status(500).json({ msg: "Email service configuration error. Please contact support." })
    }

    // Send email with OTP
    const mailOptions = {
      from: `"CHAUTARI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request for CHAUTARI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your CHAUTARI account password.</p>
          <p>Your One-Time Password (OTP) for password reset is:</p>
          <h1 style="font-size: 32px; letter-spacing: 2px; color: #333; background: #f5f5f5; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          <p>Thank you,<br>CHAUTARI Team</p>
        </div>
      `,
    }

    try {
      await transporter.sendMail(mailOptions)
      res.status(200).json({ msg: "OTP sent successfully to your email" })
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      res.status(500).json({ msg: "Failed to send OTP email. Please try again later." })
    }
  } catch (err) {
    console.error("Forgot password error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ msg: "Email and OTP are required" })
  }

  try {
    // Check if OTP exists and is valid
    const otpData = otpStore.get(email)

    if (!otpData) {
      return res.status(400).json({ msg: "OTP expired or not found. Please request a new one." })
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ msg: "OTP has expired. Please request a new one." })
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." })
    }

    // OTP is valid, but don't delete it yet as we'll need it for the reset password step
    // Just update the expiration time to give the user more time to reset their password
    otpStore.set(email, {
      ...otpData,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 more minutes
      verified: true,
    })

    res.status(200).json({ msg: "OTP verified successfully" })
  } catch (err) {
    console.error("OTP verification error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ msg: "Email, OTP, and new password are required" })
  }

  try {
    // Check if OTP exists, is valid, and has been verified
    const otpData = otpStore.get(email)

    if (!otpData || !otpData.verified) {
      return res.status(400).json({ msg: "Invalid or unverified OTP. Please restart the password reset process." })
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ msg: "OTP has expired. Please restart the password reset process." })
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." })
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
      })
    }

    // Find the user and update their password
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ msg: "User not found" })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update the user's password
    user.password = hashedPassword
    await user.save()

    // Delete the OTP from store
    otpStore.delete(email)

    res.status(200).json({ msg: "Password reset successful. You can now login with your new password." })
  } catch (err) {
    console.error("Password reset error:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  verifyPassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
}
