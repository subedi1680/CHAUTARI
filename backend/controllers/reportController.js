const Report = require("../models/Report")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const Reply = require("../models/Reply")
const mongoose = require("mongoose")

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body
    const userId = req.user.id

    if (!contentType || !contentId || !reason) {
      return res.status(400).json({ msg: "Missing required fields" })
    }

    // Validate content type
    if (!["post", "comment", "reply"].includes(contentType)) {
      return res.status(400).json({ msg: "Invalid content type" })
    }

    // Check if content exists
    let content
    switch (contentType) {
      case "post":
        content = await Post.findById(contentId)
        break
      case "comment":
        content = await Comment.findById(contentId)
        break
      case "reply":
        content = await Reply.findById(contentId)
        break
    }

    if (!content) {
      return res.status(404).json({ msg: "Content not found" })
    }

    // Check if user is reporting their own content
    if (content.user.toString() === userId) {
      return res.status(400).json({ msg: "You cannot report your own content" })
    }

    // Check if user has already reported this content
    const existingReport = await Report.findOne({
      contentType,
      contentId,
      reporter: userId,
      status: { $ne: "dismissed" }, // Allow re-reporting if previous report was dismissed
    })

    if (existingReport) {
      return res.status(400).json({ msg: "You have already reported this content" })
    }

    // Create new report
    const newReport = new Report({
      contentType,
      contentId,
      reporter: userId,
      reason,
    })

    await newReport.save()

    // Notify admins about new report (via socket)
    if (req.app.get("io")) {
      req.app.get("io").to("admins").emit("newReport", {
        reportId: newReport._id,
        contentType,
        reason,
      })
    }

    res.status(201).json({ msg: "Content reported successfully" })
  } catch (err) {
    console.error("Error creating report:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const { status, contentType } = req.query
    const query = {}

    // Apply filters if provided
    if (status && ["pending", "reviewed", "dismissed"].includes(status)) {
      query.status = status
    }

    if (contentType && ["post", "comment", "reply"].includes(contentType)) {
      query.contentType = contentType
    }

    // Get reports with populated data
    const reports = await Report.find(query)
      .populate("reporter", "username email")
      .populate("reviewedBy", "email")
      .sort({ createdAt: -1 })

    // Populate content details based on contentType
    const populatedReports = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject()

        try {
          let contentDetails

          switch (report.contentType) {
            case "post":
              contentDetails = await Post.findById(report.contentId)
                .populate("user", "username email")
                .select("title content user createdAt")
              break
            case "comment":
              contentDetails = await Comment.findById(report.contentId)
                .populate("user", "username email")
                .populate("post", "title")
                .select("content user post createdAt")
              break
            case "reply":
              contentDetails = await Reply.findById(report.contentId)
                .populate("user", "username email")
                .populate("comment", "content")
                .select("content user comment createdAt")
              break
          }

          reportObj.contentDetails = contentDetails || { deleted: true }
        } catch (err) {
          reportObj.contentDetails = { deleted: true }
        }

        return reportObj
      }),
    )

    res.json(populatedReports)
  } catch (err) {
    console.error("Error fetching reports:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Get report count (admin only)
exports.getReportCount = async (req, res) => {
  try {
    const count = await Report.countDocuments({ status: "pending" })
    res.json({ count })
  } catch (err) {
    console.error("Error fetching report count:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}

// Update report status (admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, action } = req.body
    const adminId = req.admin.id

    if (!status || !["reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" })
    }

    const report = await Report.findById(id)
    if (!report) {
      return res.status(404).json({ msg: "Report not found" })
    }

    // Update report status
    report.status = status
    report.reviewedBy = adminId
    report.reviewedAt = Date.now()
    await report.save()

    // If action is "delete" and status is "reviewed", delete the reported content
    if (action === "delete" && status === "reviewed") {
      try {
        switch (report.contentType) {
          case "post":
            await Post.findByIdAndDelete(report.contentId)
            break
          case "comment":
            await Comment.findByIdAndDelete(report.contentId)
            break
          case "reply":
            await Reply.findByIdAndDelete(report.contentId)
            break
        }
      } catch (deleteErr) {
        console.error("Error deleting reported content:", deleteErr)
        // Continue execution even if deletion fails
      }
    }

    res.json({ msg: "Report updated successfully" })
  } catch (err) {
    console.error("Error updating report:", err)
    res.status(500).json({ msg: "Server Error" })
  }
}
