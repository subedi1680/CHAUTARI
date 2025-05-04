/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"
import * as bootstrap from "bootstrap"

const UserManagementTable = ({ users, onViewUser, onUserAction }) => {
  const [actionUser, setActionUser] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("1")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = (user, action) => {
    setActionUser(user)
    setActionType(action)
    setBanReason("")
    setBanDuration("1")

    // Show the appropriate modal
    const modalElement = document.getElementById(
      action === "ban" ? "banUserModal" : action === "delete" ? "deleteUserModal" : "confirmActionModal",
    )
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement)
      modal.show()
    }
  }

  const confirmAction = async () => {
    if (!actionUser || !actionType) return

    setIsProcessing(true)

    try {
      let data = {}
      if (actionType === "ban") {
        data = {
          reason: banReason,
          duration: banDuration,
        }
      }

      const success = await onUserAction(actionUser._id, actionType, data)

      if (success) {
        // Hide the modal
        const modalElement = document.getElementById(
          actionType === "ban" ? "banUserModal" : actionType === "delete" ? "deleteUserModal" : "confirmActionModal",
        )
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement)
          if (modal) modal.hide()
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  const getBanStatus = (user) => {
    if (!user.isBanned) return <span className="badge bg-success">Active</span>

    if (!user.banExpiresAt) {
      return <span className="badge bg-danger">Permanently Banned</span>
    }

    const now = new Date()
    const expiry = new Date(user.banExpiresAt)

    if (now > expiry) {
      return <span className="badge bg-success">Ban Expired</span>
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    return (
      <span className="badge bg-warning">
        Banned ({daysRemaining} day{daysRemaining !== 1 ? "s" : ""})
      </span>
    )
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Violations</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div
                      className="avatar-sm me-2 rounded-circle bg-light d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "40px" }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.username}
                          className="rounded-circle"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <i className="bi bi-person text-secondary"></i>
                      )}
                    </div>
                    <div>{user.username}</div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{getBanStatus(user)}</td>
                <td>
                  <span
                    className={`badge ${
                      user.violationCount >= 6
                        ? "bg-danger"
                        : user.violationCount >= 3
                          ? "bg-warning"
                          : user.violationCount > 0
                            ? "bg-info"
                            : "bg-secondary"
                    }`}
                  >
                    {user.violationCount}
                  </span>
                </td>
                <td>{formatDate(user.lastActive)}</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewUser(user._id)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {user.violationCount > 0 && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleAction(user, "reset-violations")}
                        title="Reset Violations"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    )}
                    {user.isBanned ? (
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => handleAction(user, "unban")}
                        title="Unban User"
                      >
                        <i className="bi bi-unlock"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleAction(user, "ban")}
                        title="Ban User"
                      >
                        <i className="bi bi-slash-circle"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleAction(user, "delete")}
                      title="Delete User"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Action Modal */}
      <div className="modal fade" id="confirmActionModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{actionType === "reset-violations" ? "Reset Violations" : "Unban User"}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p>
                {actionType === "reset-violations"
                  ? `Are you sure you want to reset all violations for ${actionUser?.username}?`
                  : `Are you sure you want to unban ${actionUser?.username}?`}
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmAction} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ban User Modal */}
      <div className="modal fade" id="banUserModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Ban User</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p>You are about to ban user: {actionUser?.username}</p>
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
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={confirmAction}
                disabled={isProcessing || !banReason.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  "Ban User"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete User Modal */}
      <div className="modal fade" id="deleteUserModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete User</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                This action cannot be undone!
              </div>
              <p>
                Are you sure you want to permanently delete the user account for <strong>{actionUser?.username}</strong>
                ?
              </p>
              <p>All of the user's content (posts, comments, etc.) will also be deleted.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmAction} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserManagementTable
