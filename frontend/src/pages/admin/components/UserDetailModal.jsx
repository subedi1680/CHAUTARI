/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"

const UserDetailModal = ({ show, onClose, user, onUserAction }) => {
  const [activeTab, setActiveTab] = useState("info")
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("1")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAction = async (action) => {
    if (action === "delete" && !showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsProcessing(true)

    try {
      let data = {}
      if (action === "ban") {
        data = {
          reason: banReason,
          duration: banDuration,
        }
      }

      const success = await onUserAction(user.user._id, action, data)

      if (success && onClose) {
        onClose()
      }
    } finally {
      setIsProcessing(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  const formatViolationDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getActionLabel = (action) => {
    switch (action) {
      case "warning":
        return <span className="badge bg-info">Warning</span>
      case "temp_ban":
        return <span className="badge bg-warning">Temporary Ban</span>
      case "permanent_ban":
        return <span className="badge bg-danger">Permanent Ban</span>
      default:
        return <span className="badge bg-secondary">{action}</span>
    }
  }

  if (!user) return null

  return (
    <div
      className={`modal fade ${show ? "show" : ""}`}
      id="userDetailModal"
      tabIndex="-1"
      style={{ display: show ? "block" : "none" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">User Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="d-flex align-items-center mb-4">
              <div
                className="avatar-lg me-3 rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{ width: "80px", height: "80px" }}
              >
                {user.user.avatar ? (
                  <img
                    src={user.user.avatar || "/placeholder.svg"}
                    alt={user.user.username}
                    className="rounded-circle"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg"
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                    style={{ width: "100%", height: "100%" }}
                  >
                    {user.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h4 className="mb-1">{user.user.username}</h4>
                <p className="text-muted mb-0">{user.user.email}</p>
                <div className="mt-2">
                  {user.user.isBanned ? (
                    <span className="badge bg-danger me-2">
                      {user.user.banExpiresAt
                        ? `Banned until ${new Date(user.user.banExpiresAt).toLocaleDateString()}`
                        : "Permanently Banned"}
                    </span>
                  ) : (
                    <span className="badge bg-success me-2">Active</span>
                  )}
                  <span
                    className={`badge ${
                      user.user.violationCount >= 6
                        ? "bg-danger"
                        : user.user.violationCount >= 3
                          ? "bg-warning"
                          : user.user.violationCount > 0
                            ? "bg-info"
                            : "bg-secondary"
                    } me-2`}
                  >
                    {user.user.violationCount} Violations
                  </span>
                </div>
              </div>
            </div>

            {user.user.banReason && (
              <div className="alert alert-danger mb-4">
                <strong>Ban Reason:</strong> {user.user.banReason}
              </div>
            )}

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "info" ? "active" : ""}`}
                  onClick={() => setActiveTab("info")}
                >
                  User Info
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "violations" ? "active" : ""}`}
                  onClick={() => setActiveTab("violations")}
                >
                  Violation History
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "actions" ? "active" : ""}`}
                  onClick={() => setActiveTab("actions")}
                >
                  Actions
                </button>
              </li>
            </ul>

            {activeTab === "info" && (
              <div>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm mb-3">
                      <div className="card-body">
                        <h6 className="card-title">Account Information</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td>Username</td>
                              <td>{user.user.username}</td>
                            </tr>
                            <tr>
                              <td>Email</td>
                              <td>{user.user.email}</td>
                            </tr>
                            <tr>
                              <td>Last Login</td>
                              <td>{formatDate(user.user.lastLogin)}</td>
                            </tr>
                            <tr>
                              <td>Last Active</td>
                              <td>{formatDate(user.user.lastActive)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm mb-3">
                      <div className="card-body">
                        <h6 className="card-title">Content Statistics</h6>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td>Posts</td>
                              <td>{user.stats.postsCount}</td>
                            </tr>
                            <tr>
                              <td>Comments</td>
                              <td>{user.stats.commentsCount}</td>
                            </tr>
                            <tr>
                              <td>Replies</td>
                              <td>{user.stats.repliesCount}</td>
                            </tr>
                            <tr>
                              <td>Total Content</td>
                              <td>{user.stats.postsCount + user.stats.commentsCount + user.stats.repliesCount}</td>
                            </tr>
                            <tr>
                              <td>Violations</td>
                              <td>{user.user.violationCount}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Categories</h6>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {user.user.categories && user.user.categories.length > 0 ? (
                        user.user.categories.map((category, index) => (
                          <span key={index} className="badge bg-primary">
                            {category}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted mb-0">No categories selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "violations" && (
              <div>
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title">Violation History</h6>
                    {user.user.violationHistory && user.user.violationHistory.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Reason</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.user.violationHistory.map((violation, index) => (
                              <tr key={index}>
                                <td>{formatViolationDate(violation.date)}</td>
                                <td>{violation.reason}</td>
                                <td>{getActionLabel(violation.actionTaken)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No violation history</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div>
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body">
                    <h6 className="card-title">User Actions</h6>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {user.user.violationCount > 0 && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleAction("reset-violations")}
                          disabled={isProcessing}
                        >
                          <i className="bi bi-arrow-counterclockwise me-2"></i>
                          Reset Violations
                        </button>
                      )}

                      {user.user.isBanned ? (
                        <button className="btn btn-info" onClick={() => handleAction("unban")} disabled={isProcessing}>
                          <i className="bi bi-unlock me-2"></i>
                          Unban User
                        </button>
                      ) : (
                        <div className="card border-0 shadow-sm w-100 mt-3">
                          <div className="card-body">
                            <h6 className="card-title">Ban User</h6>
                            <div className="mb-3">
                              <label htmlFor="banReason" className="form-label">
                                Reason for ban
                              </label>
                              <textarea
                                className="form-control"
                                id="banReason"
                                rows="3"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                required
                              ></textarea>
                            </div>
                            <div className="mb-3">
                              <label htmlFor="banDuration" className="form-label">
                                Ban Duration
                              </label>
                              <select
                                className="form-select"
                                id="banDuration"
                                value={banDuration}
                                onChange={(e) => setBanDuration(e.target.value)}
                              >
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="permanent">Permanent</option>
                              </select>
                            </div>
                            <button
                              className="btn btn-warning"
                              onClick={() => handleAction("ban")}
                              disabled={isProcessing || !banReason.trim()}
                            >
                              <i className="bi bi-slash-circle me-2"></i>
                              Ban User
                            </button>
                          </div>
                        </div>
                      )}

                      <button className="btn btn-danger" onClick={() => handleAction("delete")} disabled={isProcessing}>
                        <i className="bi bi-trash me-2"></i>
                        Delete User Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="alert alert-danger mt-3">
                <h6 className="alert-heading">Confirm User Deletion</h6>
                <p>Are you sure you want to permanently delete this user account? This action cannot be undone.</p>
                <p>All of this user's content (posts, comments, etc.) will also be deleted.</p>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => handleAction("delete")}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
