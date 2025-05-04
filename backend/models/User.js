const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  categories: {
    type: [String],
    default: [],
  },
  categorySetupCompleted: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: "",
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    comments: {
      type: Boolean,
      default: true,
    },
    likes: {
      type: Boolean,
      default: true,
    },
    replies: {
      type: Boolean,
      default: true,
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  postCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  // New fields for user moderation
  violationCount: {
    type: Number,
    default: 0,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banExpiresAt: {
    type: Date,
    default: null,
  },
  banReason: {
    type: String,
    default: "",
  },
  // Track violation history
  violationHistory: [
    {
      reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
      date: {
        type: Date,
        default: Date.now,
      },
      reason: String,
      actionTaken: {
        type: String,
        enum: ["warning", "temp_ban", "permanent_ban"],
        default: "warning",
      },
    },
  ],
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Add method to check if user is currently banned
userSchema.methods.isCurrentlyBanned = function () {
  if (!this.isBanned) return false

  // If banExpiresAt is null, it's a permanent ban
  if (!this.banExpiresAt) return true

  // Check if temporary ban has expired
  return new Date() < this.banExpiresAt
}

// Add method to apply ban based on violation count
userSchema.methods.applyBanIfNeeded = async function () {
  if (this.violationCount >= 7) {
    // Permanent ban
    this.isBanned = true
    this.banExpiresAt = null
    this.banReason = "Exceeded maximum violation count (7+)"

    // Add to violation history
    this.violationHistory.push({
      date: new Date(),
      reason: "Exceeded maximum violation count",
      actionTaken: "permanent_ban",
    })
  } else if (this.violationCount >= 6) {
    // 7-day ban
    this.isBanned = true
    this.banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    this.banReason = "Reached 6 violations - 7 day ban"

    // Add to violation history
    this.violationHistory.push({
      date: new Date(),
      reason: "Reached 6 violations",
      actionTaken: "temp_ban",
    })
  } else if (this.violationCount >= 3) {
    // 1-day ban
    this.isBanned = true
    this.banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    this.banReason = "Reached 3 violations - 1 day ban"

    // Add to violation history
    this.violationHistory.push({
      date: new Date(),
      reason: "Reached 3 violations",
      actionTaken: "temp_ban",
    })
  }

  return this.save()
}

module.exports = mongoose.models.User || mongoose.model("User", userSchema)
