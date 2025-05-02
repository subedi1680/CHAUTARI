/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

const PostApprovalModal = ({ post, show, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!show || !post) {
    return null
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    onReject(post._id, rejectionReason)
    onClose()
  }

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      role="dialog"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Review Post: {post.title}
              <span className="ms-2">
                {post.status === "pending" && <span className="badge bg-warning">Pending</span>}
                {post.status === "approved" && <span className="badge bg-success">Approved</span>}
                {post.status === "rejected" && <span className="badge bg-danger">Rejected</span>}
              </span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <div>
                  <span className="badge bg-primary me-2">{post.category}</span>
                  <small className="text-muted">
                    Posted by {post.user?.username || "Unknown"} on {new Date(post.createdAt).toLocaleString()}
                  </small>
                </div>
                {post.edited && (
                  <small className="text-muted">Edited on {new Date(post.editedAt).toLocaleString()}</small>
                )}
              </div>

              {post.coverImage && (
                <div className="mb-3">
                  <img
                    src={`data:image/jpeg;base64,${post.coverImage}`}
                    alt="Cover"
                    className="img-fluid rounded"
                    style={{ maxHeight: "300px", width: "100%", objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Post Content</h6>
                  <p className="card-text">{post.content}</p>
                </div>
              </div>
            </div>

            {post.status === "rejected" && post.rejectionReason && (
              <div className="alert alert-danger">
                <h6>Rejection Reason:</h6>
                <p className="mb-0">{post.rejectionReason}</p>
              </div>
            )}

            {showRejectForm && (
              <div className="mt-3">
                <h6>Provide Rejection Reason</h6>
                <div className="form-group">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this post is being rejected..."
                    required
                  ></textarea>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>

            {post.status === "pending" && (
              <>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    onApprove(post._id)
                    onClose()
                  }}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Approve
                </button>
                {!showRejectForm ? (
                  <button type="button" className="btn btn-danger" onClick={() => setShowRejectForm(true)}>
                    <i className="bi bi-x-circle me-1"></i>
                    Reject
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger" onClick={handleReject}>
                    Confirm Rejection
                  </button>
                )}
              </>
            )}

            {post.status === "approved" && (
              <>
                {!showRejectForm ? (
                  <button type="button" className="btn btn-warning" onClick={() => setShowRejectForm(true)}>
                    <i className="bi bi-arrow-repeat me-1"></i>
                    Change to Rejected
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger" onClick={handleReject}>
                    Confirm Rejection
                  </button>
                )}
              </>
            )}

            {post.status === "rejected" && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  onApprove(post._id)
                  onClose()
                }}
              >
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

export default PostApprovalModal
