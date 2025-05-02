/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import DashboardStats from "./components/DashboardStats"
import { useAdminSocket, fetchPendingCount } from "../../hooks/useAdminSocket"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  // Handle new post notification
  const handleNewPost = useCallback((data) => {
    setNotification({
      type: "new-post",
      message: `New post submitted: "${data.title}" by ${data.username}`,
      timestamp: new Date(),
    })

    // Refresh stats
    fetchStats()
  }, [])

  // Handle post status change notification
  const handlePostStatusChange = useCallback((data) => {
    setNotification({
      type: "status-change",
      message: `Post "${data.title}" ${data.newStatus === "approved" ? "approved" : "rejected"}`,
      timestamp: new Date(),
    })

    // Refresh stats
    fetchStats()
  }, [])

  // Initialize admin socket
  useAdminSocket(handleNewPost, handlePostStatusChange)

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          sessionStorage.removeItem("adminToken")
          navigate("/admin/login")
          return
        }
        throw new Error("Failed to fetch admin stats")
      }

      const data = await response.json()
      setStats(data)

      // Update pending count in session storage
      sessionStorage.setItem("adminPendingCount", data.postCounts.pending.toString())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [API_BASE_URL, navigate])

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    // Fetch initial pending count
    fetchPendingCount()

    // Fetch dashboard stats
    fetchStats()

    // Set up refresh interval (every 30 seconds)
    const refreshInterval = setInterval(fetchStats, 30000)

    return () => clearInterval(refreshInterval)
  }, [fetchStats, navigate])

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  if (loading && !stats) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="dashboard" />

      <div className="admin-content flex-grow-1">
        {notification && (
          <div
            className={`alert ${notification.type === "new-post" ? "alert-info" : "alert-success"} alert-dismissible fade show m-3`}
          >
            <i className={`bi ${notification.type === "new-post" ? "bi-bell" : "bi-check-circle"} me-2`}></i>
            {notification.message}
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        )}

        <div className="container-fluid p-4">
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <h4 className="mb-4">Dashboard</h4>
              <DashboardStats stats={stats} />

              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white py-3">
                      <h5 className="card-title mb-0">Recent Activity</h5>
                    </div>
                    <div className="card-body p-0">
                      <ul className="list-group list-group-flush">
                        {stats?.recentActivity?.map((activity, index) => (
                          <li key={index} className="list-group-item border-0 py-3">
                            <div className="d-flex align-items-center">
                              <div className={`activity-icon ${activity.status}`}>
                                {activity.status === "pending" && <i className="bi bi-hourglass-split"></i>}
                                {activity.status === "approved" && <i className="bi bi-check-circle"></i>}
                                {activity.status === "rejected" && <i className="bi bi-x-circle"></i>}
                              </div>
                              <div className="ms-3">
                                <h6 className="mb-1 text-truncate" style={{ maxWidth: "200px" }}>
                                  {activity.title}
                                </h6>
                                <div className="d-flex align-items-center">
                                  <small className="text-muted">by {activity.user?.username || "Unknown"}</small>
                                  <span className="mx-2">•</span>
                                  <small className="text-muted">
                                    {new Date(activity.createdAt).toLocaleDateString()}
                                  </small>
                                </div>
                              </div>
                              <span
                                className={`ms-auto badge ${
                                  activity.status === "pending"
                                    ? "bg-warning"
                                    : activity.status === "approved"
                                      ? "bg-secondary"
                                      : "bg-danger"
                                }`}
                              >
                                {activity.status}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
