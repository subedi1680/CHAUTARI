const mongoose = require("mongoose")

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Add index for faster queries
AdminSchema.index({ email: 1 })
AdminSchema.index({ role: 1 })
AdminSchema.index({ active: 1 })

// Check if the model exists before creating it
module.exports = mongoose.models.Admin || mongoose.model("Admin", AdminSchema)
