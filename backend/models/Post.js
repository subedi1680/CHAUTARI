const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    coverImage: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

postSchema.statics.isValidObjectId = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = mongoose.model("Post", postSchema);
