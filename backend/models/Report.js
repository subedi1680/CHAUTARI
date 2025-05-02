const mongoose = require("mongoose")

const ReportSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ["post", "comment", "reply"],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "contentType",
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// Add indexes for faster queries
ReportSchema.index({ contentType: 1, contentId: 1 })
ReportSchema.index({ status: 1 })
ReportSchema.index({ reporter: 1 })

module.exports = mongoose.models.Report || mongoose.model("Report", ReportSchema)
