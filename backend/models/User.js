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
  bio: {
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
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model("User", userSchema)
