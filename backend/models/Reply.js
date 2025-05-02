// Check if this model is properly registered
// If the file exists, we'll just make sure the model registration is correct
const mongoose = require("mongoose")

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

// Only modify the export line if the file exists
module.exports = mongoose.models.Reply || mongoose.model("Reply", replySchema)
