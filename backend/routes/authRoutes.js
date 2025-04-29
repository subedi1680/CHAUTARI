const express = require("express")
const router = express.Router()
const { registerUser, loginUser, sendOtp, verifyOtp, verifyPassword } = require("../controllers/authController")
const authMiddleware = require("../middlewares/authMiddleware")

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)
router.post("/verify-password", authMiddleware, verifyPassword)

module.exports = router
