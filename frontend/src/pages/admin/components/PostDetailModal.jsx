/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect, useRef } from "react"
import UserAvatar from "../../../components/UserAvatar"
import DOMPurify from "dompurify"

const PostDetailModal = ({ post, show, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const modalRef = useRef(null)

  // Reset form state when modal closes
  useEffect(() => {
    if (!show) {
      setShowRejectForm(false)
      setRejectionReason("")
      setError(null)
    }
  }, [show])

  if (!show || !post) return null

  const handleApprove = () => {
    onApprove(post._id)
    onClose()
  }

  const handleReject = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection")
      setIsSubmitting(false)
      return
    }

    onReject(post._id, rejectionReason)
    setIsSubmitting(false)
    setShowRejectForm(false)
    setRejectionReason("")
    onClose()
  }

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Safely render HTML content with sanitization
  const renderContent = (content) => {
    if (!content) return <p className="text-muted">No content available</p>
    return <div className="post-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
  }

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        ref={modalRef}
        style={{ width: "800px", maxWidth: "800px" }}
      >
        <div className="modal-content border-0 shadow" style={{ width: "100%" }}>
          {/* Modal Header */}
          <div className="modal-header align-items-center">
            <h5 className="modal-title">
              Post Details
              {post.status === "pending" && <span className="badge bg-warning ms-2">Pending</span>}
              {post.status === "approved" && <span className="badge bg-success ms-2">Approved</span>}
              {post.status === "rejected" && <span className="badge bg-danger ms-2">Rejected</span>}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            {/* Post Header */}
            <div className="post-header mb-4">
              <h3 className="mb-3">{post.title}</h3>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <UserAvatar user={post.user} size="md" />
                  <div className="ms-2">
                    <div className="fw-bold">{post.user?.username || "Unknown User"}</div>
                    <div className="text-muted small">
                      <i className="bi bi-calendar3 me-1"></i>
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
                <span className="badge bg-primary">{post.category}</span>
              </div>

              {post.coverImage && (
                <div className="post-cover-image mb-3">
                  <img
                    src={`data:image/jpeg;base64,${post.coverImage}`}
                    alt="Cover"
                    className="img-fluid rounded"
                    style={{ maxHeight: "300px", width: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="post-content-container p-3 bg-light rounded mb-4">
              <h6 className="fw-bold mb-3">Content</h6>
              <div className="post-content-scroll" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {renderContent(post.content)}
              </div>
            </div>

            {/* Post Metadata */}
            <div className="post-metadata mb-4">
              <h6 className="fw-bold mb-2">Additional Information</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">
                        <i className="bi bi-info-circle me-2"></i>
                        Post Details
                      </h6>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>Status</span>
                          <span className="fw-medium">{post.status}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>Category</span>
                          <span className="fw-medium">{post.category}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>Created</span>
                          <span className="fw-medium">{formatDate(post.createdAt)}</span>
                        </li>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <li className="list-group-item d-flex justify-content-between px-0">
                            <span>Last Updated</span>
                            <span className="fw-medium">{formatDate(post.updatedAt)}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">
                        <i className="bi bi-person me-2"></i>
                        Author Information
                      </h6>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>Username</span>
                          <span className="fw-medium">{post.user?.username || "Unknown"}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>Email</span>
                          <span className="fw-medium">{post.user?.email || "N/A"}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between px-0">
                          <span>User ID</span>
                          <span className="fw-medium text-truncate" style={{ maxWidth: "180px" }}>
                            {post.user?._id || "N/A"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason (if rejected) */}
            {post.status === "rejected" && post.rejectionReason && (
              <div className="alert alert-danger">
                <h6 className="alert-heading">
                  <i className="bi bi-x-circle me-2"></i>
                  Rejection Reason
                </h6>
                <p className="mb-0">{post.rejectionReason}</p>
              </div>
            )}

            {/* Rejection Form */}
            {showRejectForm && (
              <form onSubmit={handleReject} className="mt-3">
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Reason for Rejection
                  </label>
                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this post..."
                    required
                  ></textarea>
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      "Confirm Rejection"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>

            {post.status === "pending" && (
              <>
                <button type="button" className="btn btn-success" onClick={handleApprove}>
                  <i className="bi bi-check-circle me-1"></i>
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowRejectForm(true)}
                  disabled={showRejectForm}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Reject
                </button>
              </>
            )}

            {post.status === "approved" && (
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => setShowRejectForm(true)}
                disabled={showRejectForm}
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                Change to Rejected
              </button>
            )}

            {post.status === "rejected" && (
              <button type="button" className="btn btn-success" onClick={handleApprove}>
                <i className="bi bi-arrow-repeat me-1"></i>
                Change to Approved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetailModal
