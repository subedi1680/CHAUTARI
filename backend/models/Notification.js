const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["comment", "like", "reply", "mention", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Check if this model is properly registered
// If the file exists, we'll just make sure the model registration is correct

// Only modify the export line if the file exists
module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
