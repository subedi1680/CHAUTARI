const Report = require("../models/Report")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const Reply = require("../models/Reply")
const User = require("../models/User")
const mongoose = require("mongoose")
const { createNotification } = require("./notificationController")

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  const { contentType, contentId, reason } = req.body

  if (!contentType || !contentId || !reason) {
    return res.status(400).json({ msg: "Please provide all required fields" })
  }

  try {
    // Check if the content exists
    let contentModel
    switch (contentType) {
      case "post":
        contentModel = Post
        break
      case "comment":
        contentModel = Comment
        break
      case "reply":
        contentModel = Reply
        break
      default:
        return res.status(400).json({ msg: "Invalid content type" })
    }

    const content = await contentModel.findById(contentId)
    if (!content) {
      return res.status(404).json({ msg: "Content not found" })
    }

    // Check if user has already reported this content
    const existingReport = await Report.findOne({
      contentType,
      contentId,
      reporter: req.user.id,
    })

    if (existingReport) {
      return res.status(400).json({ msg: "You have already reported this content" })
    }

    // Create new report
    const report = new Report({
      contentType,
      contentId,
      reporter: req.user.id,
      reason,
    })

    await report.save()

    // Notify admins via socket.io
    const io = req.app.get("io")
    if (io) {
      io.to("admins").emit("newReport", {
        reportId: report._id,
        contentType,
        reason,
      })
    }

    res.status(201).json({ msg: "Report submitted successfully", report })
  } catch (err) {
    console.error("Error creating report:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get all reports (with filters)
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getAllReports = async (req, res) => {
  try {
    const { status, contentType, sort = "createdAt" } = req.query
    const query = {}

    // Apply filters if provided
    if (status && ["pending", "reviewed", "dismissed"].includes(status)) {
      query.status = status
    }

    if (contentType && ["post", "comment", "reply"].includes(contentType)) {
      query.contentType = contentType
    }

    // Sort direction
    const sortDirection = sort.startsWith("-") ? -1 : 1
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort

    // Get reports with populated reporter
    const reports = await Report.find(query)
      .populate("reporter", "username email avatar")
      .sort({ [sortField]: sortDirection })

    // Fetch content details for each report
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject()

        try {
          let contentModel
          switch (report.contentType) {
            case "post":
              contentModel = Post
              break
            case "comment":
              contentModel = Comment
              break
            case "reply":
              contentModel = Reply
              break
          }

          const content = await contentModel.findById(report.contentId)

          if (content) {
            // Add the content directly to the report object for easier frontend access
            reportObj.content = content.toObject ? content.toObject() : content

            // Populate user for the content
            if (report.contentType === "post") {
              await content.populate("user", "username email avatar violationCount isBanned banExpiresAt")
              reportObj.content.user = content.user
              // Add both title and content fields for consistency
              reportObj.content.title = content.title
              reportObj.content.body = content.content // Map content to body for frontend compatibility
            } else if (report.contentType === "comment") {
              await content.populate("user", "username email avatar violationCount isBanned banExpiresAt")
              await content.populate("post", "title")
              reportObj.content.user = content.user
              reportObj.content.post = content.post
              reportObj.content.text = content.content // Map content to text for frontend compatibility
            } else if (report.contentType === "reply") {
              await content.populate("user", "username email avatar violationCount isBanned banExpiresAt")
              await content.populate("comment", "content")
              reportObj.content.user = content.user
              reportObj.content.comment = content.comment
              reportObj.content.text = content.content // Map content to text for frontend compatibility
            }

            // Keep the contentDetails for backward compatibility
            reportObj.contentDetails = {
              title: report.contentType === "post" ? content.title : undefined,
              content: content.content,
              user: content.user,
              post: report.contentType === "comment" ? content.post : undefined,
              comment: report.contentType === "reply" ? content.comment : undefined,
            }
          } else {
            reportObj.content = { deleted: true }
            reportObj.contentDetails = { deleted: true }
          }
        } catch (err) {
          console.error(`Error fetching content for report ${report._id}:`, err.message)
          reportObj.content = { error: true }
          reportObj.contentDetails = { error: true }
        }

        return reportObj
      }),
    )

    res.json(reportsWithDetails)
  } catch (err) {
    console.error("Error fetching reports:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Get report count by status
// @route   GET /api/admin/reports/count
// @access  Private (Admin only)
const getReportCount = async (req, res) => {
  try {
    const counts = await Report.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Convert to object with status as keys
    const countObj = {
      pending: 0,
      reviewed: 0,
      dismissed: 0,
    }

    counts.forEach((item) => {
      countObj[item._id] = item.count
    })

    // Calculate total
    countObj.total = countObj.pending + countObj.reviewed + countObj.dismissed

    res.json({ count: countObj })
  } catch (err) {
    console.error("Error fetching report count:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin only)
const updateReportStatus = async (req, res) => {
  const { status, action } = req.body

  if (!status && !action) {
    return res.status(400).json({ msg: "Please provide status or action" })
  }

  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ msg: "Report not found" })
    }

    // Handle actions
    if (action) {
      switch (action) {
        case "dismiss":
          report.status = "dismissed"
          break
        case "delete":
          // Delete the reported content
          let contentModel
          switch (report.contentType) {
            case "post":
              contentModel = Post
              break
            case "comment":
              contentModel = Comment
              break
            case "reply":
              contentModel = Reply
              break
          }

          const content = await contentModel.findById(report.contentId)
          if (content) {
            // Get the user who created the content
            const userId = content.user

            // Increment violation count for the user
            const user = await User.findById(userId)
            if (user) {
              user.violationCount += 1

              // Add to violation history
              user.violationHistory.push({
                reportId: report._id,
                date: new Date(),
                reason: report.reason,
                actionTaken: "warning",
              })

              // Check if user should be banned based on violation count
              await user.applyBanIfNeeded()

              // Notify user about the violation
              try {
                await createNotification({
                  recipient: userId,
                  type: "system",
                  content: `Your ${report.contentType} was removed due to a violation. You now have ${user.violationCount} violation(s).${user.isBanned ? " Your account has been temporarily banned." : ""}`,
                })
              } catch (notifError) {
                console.error("Error creating violation notification:", notifError)
              }
            }

            // Delete the content
            await content.deleteOne()
          }

          report.status = "reviewed"
          break
        default:
          return res.status(400).json({ msg: "Invalid action" })
      }
    } else if (status) {
      // Direct status update
      if (!["pending", "reviewed", "dismissed"].includes(status)) {
        return res.status(400).json({ msg: "Invalid status" })
      }
      report.status = status
    }

    // Update review information
    report.reviewedBy = req.admin.id
    report.reviewedAt = Date.now()

    await report.save()

    res.json({ msg: "Report updated successfully", report })
  } catch (err) {
    console.error("Error updating report:", err.message)
    res.status(500).json({ msg: "Server Error" })
  }
}

module.exports = {
  createReport,
  getAllReports,
  getReportCount,
  updateReportStatus,
}
