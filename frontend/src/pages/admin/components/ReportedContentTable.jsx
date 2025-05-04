"use client"

import React from "react"

/* eslint-disable react/prop-types */
import { useState } from "react"

const ReportedContentTable = ({ reports, loading, onAction }) => {
  const [expandedReportId, setExpandedReportId] = useState(null)

  // Toggle report details
  const toggleDetails = (reportId) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get content type badge
  const getContentTypeBadge = (contentType) => {
    switch (contentType) {
      case "post":
        return <span className="badge bg-primary">Post</span>
      case "comment":
        return <span className="badge bg-info">Comment</span>
      case "reply":
        return <span className="badge bg-secondary">Reply</span>
      default:
        return <span className="badge bg-dark">Unknown</span>
    }
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      case "reviewed":
        return <span className="badge bg-success">Reviewed</span>
      case "dismissed":
        return <span className="badge bg-secondary">Dismissed</span>
      default:
        return <span className="badge bg-dark">Unknown</span>
    }
  }

  // Helper function to get reporter username
  const getReporterName = (report) => {
    return report.reporter?.username || "Anonymous"
  }

  // Helper function to safely get content details
  const getContentDetails = (report) => {
    if (!report || !report.content) {
      return { title: "Content not available", body: "Content not available", text: "Content not available" }
    }

    if (report.content.deleted) {
      return { title: "Content deleted", body: "Content deleted", text: "Content deleted" }
    }

    if (report.content.error) {
      return { title: "Error loading content", body: "Error loading content", text: "Error loading content" }
    }

    return report.content
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading reports...</p>
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No reports found matching your criteria.
      </div>
    )
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Content Type</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const contentDetails = getContentDetails(report)

              return (
                <React.Fragment key={report._id}>
                  <tr className={expandedReportId === report._id ? "table-active" : ""}>
                    <td>{getContentTypeBadge(report.contentType)}</td>
                    <td>{getReporterName(report)}</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: "200px" }}>
                        {report.reason}
                      </div>
                    </td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>{getStatusBadge(report.status)}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => toggleDetails(report._id)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {report.status === "pending" && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => onAction(report._id, "dismiss")}
                              title="Dismiss Report"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>

                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => onAction(report._id, "delete")}
                              title="Delete Content"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedReportId === report._id && (
                    <tr className="table-light">
                      <td colSpan="6" className="p-3">
                        <div className="card border-0">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Report Details</h6>
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <p className="mb-1">
                                  <strong>Reported Content:</strong>
                                </p>
                                <div className="p-2 bg-light rounded">
                                  {report.contentType === "post" && (
                                    <>
                                      <h6>{contentDetails.title || "Title not available"}</h6>
                                      <p>{contentDetails.body || contentDetails.content || "Content not available"}</p>
                                    </>
                                  )}
                                  {(report.contentType === "comment" || report.contentType === "reply") && (
                                    <p>{contentDetails.text || contentDetails.content || "Content not available"}</p>
                                  )}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <p className="mb-1">
                                  <strong>Additional Information:</strong>
                                </p>
                                <ul className="list-group list-group-flush">
                                  <li className="list-group-item bg-transparent px-0">
                                    <strong>Content Creator:</strong> {contentDetails.user?.username || "Unknown"}
                                  </li>
                                  {report.contentType === "comment" && (
                                    <li className="list-group-item bg-transparent px-0">
                                      <strong>On Post:</strong> {contentDetails.post?.title || "Unknown post"}
                                    </li>
                                  )}
                                  {report.contentType === "reply" && (
                                    <li className="list-group-item bg-transparent px-0">
                                      <strong>On Comment:</strong>{" "}
                                      {contentDetails.comment?.content || "Unknown comment"}
                                    </li>
                                  )}
                                  <li className="list-group-item bg-transparent px-0">
                                    <strong>Report Reason:</strong> {report.reason}
                                  </li>
                                  <li className="list-group-item bg-transparent px-0">
                                    <strong>Reported At:</strong> {formatDate(report.createdAt)}
                                  </li>
                                  {report.status !== "pending" && (
                                    <li className="list-group-item bg-transparent px-0">
                                      <strong>Reviewed At:</strong> {formatDate(report.reviewedAt)}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            {report.status === "pending" && (
                              <div className="d-flex gap-2 justify-content-end">
                                <button className="btn btn-success" onClick={() => onAction(report._id, "dismiss")}>
                                  <i className="bi bi-check-lg me-1"></i> Dismiss Report
                                </button>
                                <button className="btn btn-danger" onClick={() => onAction(report._id, "delete")}>
                                  <i className="bi bi-trash me-1"></i> Delete Content
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReportedContentTable
