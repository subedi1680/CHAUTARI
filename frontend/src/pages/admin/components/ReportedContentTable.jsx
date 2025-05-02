/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"

const ReportedContentTable = ({ reports, loading, onAction }) => {
  const [expandedReportId, setExpandedReportId] = useState(null)

  const toggleExpand = (reportId) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      case "reviewed":
        return <span className="badge bg-success">Reviewed</span>
      case "dismissed":
        return <span className="badge bg-secondary">Dismissed</span>
      default:
        return <span className="badge bg-light text-dark">Unknown</span>
    }
  }

  const getContentTypeBadge = (type) => {
    switch (type) {
      case "post":
        return <span className="badge bg-primary">Post</span>
      case "comment":
        return <span className="badge bg-info">Comment</span>
      case "reply":
        return <span className="badge bg-dark">Reply</span>
      default:
        return <span className="badge bg-light text-dark">Unknown</span>
    }
  }

  const renderContentPreview = (report) => {
    if (!report.contentDetails || report.contentDetails.deleted) {
      return <div className="alert alert-secondary">Content has been deleted</div>
    }

    switch (report.contentType) {
      case "post":
        return (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">{report.contentDetails.title}</h6>
              <small>by {report.contentDetails.user?.username}</small>
            </div>
            <div className="card-body">
              <p className="card-text">{report.contentDetails.content}</p>
            </div>
          </div>
        )
      case "comment":
        return (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Comment on: {report.contentDetails.post?.title}</h6>
              <small>by {report.contentDetails.user?.username}</small>
            </div>
            <div className="card-body">
              <p className="card-text">{report.contentDetails.content}</p>
            </div>
          </div>
        )
      case "reply":
        return (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Reply to comment</h6>
              <small>by {report.contentDetails.user?.username}</small>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <small className="text-muted">In response to:</small>
                <p className="mb-0 ps-3 border-start border-2">{report.contentDetails.comment?.content}</p>
              </div>
              <p className="card-text">{report.contentDetails.content}</p>
            </div>
          </div>
        )
      default:
        return <div className="alert alert-secondary">Unknown content type</div>
    }
  }

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading reports...</p>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center my-5">
        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
        <h5 className="mt-3">No reports found</h5>
        <p className="text-muted">There are no reports matching your current filters.</p>
      </div>
    )
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Type</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <>
                <tr key={report._id} className={expandedReportId === report._id ? "table-active" : ""}>
                  <td>{getContentTypeBadge(report.contentType)}</td>
                  <td>{report.reporter?.username || "Unknown"}</td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: "200px" }}>
                      {report.reason}
                    </div>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(report._id)}>
                        <i className={`bi bi-${expandedReportId === report._id ? "chevron-up" : "chevron-down"}`}></i>
                      </button>
                      {report.status === "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onAction(report._id, "dismiss")}
                            title="Dismiss Report"
                          >
                            <i className="bi bi-check"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this content?")) {
                                onAction(report._id, "delete")
                              }
                            }}
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
                  <tr>
                    <td colSpan="6" className="p-3 bg-light">
                      <div className="mb-3">
                        <h6 className="mb-2">Report Details</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Reported By:</strong> {report.reporter?.username} ({report.reporter?.email})
                            </div>
                            <div className="mb-2">
                              <strong>Report Date:</strong> {formatDate(report.createdAt)}
                            </div>
                            {report.reviewedAt && (
                              <div className="mb-2">
                                <strong>Reviewed Date:</strong> {formatDate(report.reviewedAt)}
                              </div>
                            )}
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Reason:</strong>
                            </div>
                            <div className="p-2 bg-white rounded border">{report.reason}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-2">Reported Content</h6>
                        {renderContentPreview(report)}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReportedContentTable
