const User = require("../models/User")

// Middleware to check if a user is banned
const checkBanStatus = async (req, res, next) => {
  try {
    // Skip if no user is authenticated
    if (!req.user || !req.user.id) {
      return next()
    }

    const user = await User.findById(req.user.id)

    // If user not found, continue
    if (!user) {
      return next()
    }

    // Check if temporary ban has expired
    if (user.isBanned && user.banExpiresAt && new Date() > user.banExpiresAt) {
      // Ban has expired, remove it
      user.isBanned = false
      user.banExpiresAt = null
      user.banReason = ""
      await user.save()
      return next()
    }

    // Check if user is banned
    if (user.isBanned) {
      // Format ban expiry message
      let banMessage = "Your account has been banned."
      if (user.banExpiresAt) {
        const expiryDate = new Date(user.banExpiresAt).toLocaleDateString()
        banMessage = `Your account is temporarily banned until ${expiryDate}.`
      } else {
        banMessage = "Your account has been permanently banned."
      }

      if (user.banReason) {
        banMessage += ` Reason: ${user.banReason}`
      }

      return res.status(403).json({
        msg: banMessage,
        isBanned: true,
        banExpiresAt: user.banExpiresAt,
        banReason: user.banReason,
      })
    }

    next()
  } catch (err) {
    console.error("Error checking ban status:", err.message)
    next()
  }
}

module.exports = checkBanStatus
