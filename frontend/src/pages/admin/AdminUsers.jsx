/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import AdminSidebar from "./components/AdminSidebar"
import "./admin.css"

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    usersWithViolations: 0,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    fetchUsers()
    fetchUserStats()
  }, [currentPage, searchTerm, refreshTrigger])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) {
        setError("Admin token not found")
        setLoading(false)
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/users?page=${currentPage}&limit=10&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.pages || 1)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(err.message)
      setLoading(false)
      // Set empty array to prevent undefined errors
      setUsers([])
    }
  }

  const fetchUserStats = async () => {
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) return

      const response = await fetch(`${API_BASE_URL}/api/admin/users/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`)
      }

      const data = await response.json()
      setUserStats({
        totalUsers: data.totalUsers || 0,
        bannedUsers: data.bannedUsers || 0,
        usersWithViolations: data.usersWithViolations || 0,
      })
    } catch (err) {
      console.error("Error fetching user stats:", err)
      // Set default values to prevent UI errors
      setUserStats({
        totalUsers: 0,
        bannedUsers: 0,
        usersWithViolations: 0,
      })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleViewUser = (userId) => {
    const user = users.find((u) => u._id === userId)
    if (user) {
      setSelectedUser(user)
      setShowUserDetail(true)
    }
  }

  const handleDeleteClick = (userId) => {
    const user = users.find((u) => u._id === userId)
    if (user) {
      setUserToDelete(user)
      setShowDeleteConfirm(true)
    }
  }

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) {
        setError("Admin token not found")
        return false
      }

      let url = `${API_BASE_URL}/api/admin/users/${userId}`
      let method = "PUT"
      let body = data

      switch (action) {
        case "reset-violations":
          url += "/reset-violations"
          break
        case "ban":
          url += "/ban"
          if (!body.reason) {
            body = { duration: 7, reason: "Violation of community guidelines" }
          }
          break
        case "unban":
          url += "/unban"
          break
        case "delete":
          method = "DELETE"
          break
        default:
          throw new Error("Invalid action")
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: method !== "DELETE" ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} user: ${response.status}`)
      }

      // Refresh the user list and stats
      setRefreshTrigger((prev) => prev + 1)

      // Close modals if open
      setShowUserDetail(false)
      setShowDeleteConfirm(false)
      setUserToDelete(null)

      return true
    } catch (err) {
      console.error(`Error performing ${action}:`, err)
      setError(err.message)
      return false
    }
  }

  const getBanStatusLabel = (user) => {
    if (!user.isBanned) return <span className="badge bg-success">Active</span>

    if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
      return <span className="badge bg-warning text-dark">Temp. Banned</span>
    }

    return <span className="badge bg-danger">Banned</span>
  }

  const getViolationClass = (count) => {
    if (count === 0) return ""
    if (count < 3) return "text-warning"
    return "text-danger"
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="users" />
      <div className="admin-content flex-grow-1">
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">User Management</h1>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setRefreshTrigger((prev) => prev + 1)}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="stats-card primary">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-number">{userStats.totalUsers}</div>
                    <div className="stats-text">Total Users</div>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stats-card danger">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-number">{userStats.bannedUsers}</div>
                    <div className="stats-text">Banned Users</div>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-person-x"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stats-card warning">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stats-number">{userStats.usersWithViolations}</div>
                    <div className="stats-text">Users with Violations</div>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">
                    <i className="bi bi-search me-1"></i> Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Users Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center p-5">
                  <i className="bi bi-people text-muted" style={{ fontSize: "3rem" }}></i>
                  <p className="mt-3">No users found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover admin-table user-management-table mb-0">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Posts</th>
                        <th>Comments</th>
                        <th>Violations</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="user-info">
                              {user.avatar ? (
                                <img
                                  src={user.avatar || "/placeholder.svg"}
                                  alt={user.username}
                                  className="user-avatar"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = "/placeholder.svg?height=40&width=40"
                                  }}
                                />
                              ) : (
                                <div className="user-avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
                              )}
                              <div className="user-details">
                                <p className="user-name">{user.username}</p>
                                <p className="user-email">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>{user.postCount || 0}</td>
                          <td>{user.commentCount || 0}</td>
                          <td>
                            <span className={`violation-count ${getViolationClass(user.violationCount)}`}>
                              {user.violationCount || 0}
                            </span>
                          </td>
                          <td>{getBanStatusLabel(user)}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="action-btn view me-1"
                                onClick={() => handleViewUser(user._id)}
                                title="View user details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              {user.violationCount > 0 && (
                                <button
                                  className="action-btn edit me-1"
                                  onClick={() => handleUserAction(user._id, "reset-violations")}
                                  title="Reset violations"
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                              )}
                              {!user.isBanned ? (
                                <button
                                  className="action-btn delete me-1"
                                  onClick={() => handleUserAction(user._id, "ban")}
                                  title="Ban user"
                                >
                                  <i className="bi bi-slash-circle"></i>
                                </button>
                              ) : (
                                <button
                                  className="action-btn edit me-1"
                                  onClick={() => handleUserAction(user._id, "unban")}
                                  title="Unban user"
                                >
                                  <i className="bi bi-check-circle"></i>
                                </button>
                              )}
                              <button
                                className="action-btn delete"
                                onClick={() => handleDeleteClick(user._id)}
                                title="Delete user"
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
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="User pagination">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages).keys()].map((page) => (
                    <li key={page + 1} className={`page-item ${currentPage === page + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(page + 1)}>
                        {page + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && showUserDetail && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content user-detail-modal">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowUserDetail(false)}></button>
              </div>
              <div className="modal-body">
                <div className="user-header">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar || "/placeholder.svg"}
                      alt={selectedUser.username}
                      className="user-avatar-large"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=80&width=80"
                      }}
                    />
                  ) : (
                    <div className="user-avatar-large-placeholder">{selectedUser.username.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="user-header-info">
                    <h4>{selectedUser.username}</h4>
                    <p className="text-muted mb-1">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="user-stats">
                  <div className="user-stat-item">
                    <div className="user-stat-value">{selectedUser.postCount || 0}</div>
                    <div className="user-stat-label">Posts</div>
                  </div>
                  <div className="user-stat-item">
                    <div className="user-stat-value">{selectedUser.commentCount || 0}</div>
                    <div className="user-stat-label">Comments</div>
                  </div>
                  <div className="user-stat-item">
                    <div className="user-stat-value">{selectedUser.violationCount || 0}</div>
                    <div className="user-stat-label">Violations</div>
                  </div>
                  <div className="user-stat-item">
                    <div className="user-stat-value">
                      {selectedUser.isBanned ? (
                        <span className="text-danger">Banned</span>
                      ) : (
                        <span className="text-success">Active</span>
                      )}
                    </div>
                    <div className="user-stat-label">Status</div>
                  </div>
                </div>

                {selectedUser.isBanned && (
                  <div className="alert alert-danger">
                    <h6 className="alert-heading">Ban Information</h6>
                    <p className="mb-0">
                      {selectedUser.banExpiresAt && new Date(selectedUser.banExpiresAt) > new Date() ? (
                        <>Temporarily banned until {new Date(selectedUser.banExpiresAt).toLocaleString()}</>
                      ) : (
                        "Permanently banned"
                      )}
                    </p>
                    {selectedUser.banReason && (
                      <p className="mt-2 mb-0">
                        <strong>Reason:</strong> {selectedUser.banReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Violation History */}
                <div className="violation-history">
                  <h6>Violation History</h6>
                  {selectedUser.violationHistory && selectedUser.violationHistory.length > 0 ? (
                    selectedUser.violationHistory.map((violation, index) => (
                      <div className="violation-item" key={index}>
                        <div className="violation-date">{new Date(violation.date).toLocaleString()}</div>
                        <div className="violation-reason">{violation.reason}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No violations recorded</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <div className="action-buttons">
                  {selectedUser.violationCount > 0 && (
                    <button
                      className="btn btn-outline-success"
                      onClick={() => handleUserAction(selectedUser._id, "reset-violations")}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Reset Violations
                    </button>
                  )}
                  {!selectedUser.isBanned ? (
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleUserAction(selectedUser._id, "ban")}
                    >
                      <i className="bi bi-slash-circle me-1"></i>
                      Ban User
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-success"
                      onClick={() => handleUserAction(selectedUser._id, "unban")}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Unban User
                    </button>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => setShowUserDetail(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUserDetail && <div className="modal-backdrop fade show"></div>}

      {/* Delete Confirmation Modal */}
      {userToDelete && showDeleteConfirm && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm User Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  This action cannot be undone!
                </div>
                <p>
                  Are you sure you want to permanently delete the user <strong>{userToDelete.username}</strong>?
                </p>
                <p>All of this user's content (posts, comments, etc.) will also be deleted.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleUserAction(userToDelete._id, "delete")}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && <div className="modal-backdrop fade show"></div>}
    </div>
  )
}

export default AdminUsers
