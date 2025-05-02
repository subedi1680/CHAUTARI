/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import ReportedContentTable from "./components/ReportedContentTable"
import { useAdminSocket } from "../../hooks/useAdminSocket"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ status: "pending", contentType: "all" })
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  // Handle new report notification
  const handleNewReport = (data) => {
    setNotification({
      type: "new-report",
      message: `New ${data.contentType} reported: ${data.reason}`,
      timestamp: new Date(),
    })

    // Refresh reports if we're viewing pending reports
    if (filter.status === "pending") {
      fetchReports()
    }
  }

  // Initialize admin socket
  useAdminSocket(null, null, handleNewReport)

  // Fetch reports based on filters
  const fetchReports = async () => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (filter.status !== "all") queryParams.append("status", filter.status)
      if (filter.contentType !== "all") queryParams.append("contentType", filter.contentType)

      const response = await fetch(`${API_BASE_URL}/api/admin/reports?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("adminToken")
          navigate("/admin/login")
          return
        }
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data)

      // Update report count in session storage
      const pendingCount = data.filter((report) => report.status === "pending").length
      sessionStorage.setItem("adminReportCount", pendingCount.toString())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle report action (dismiss or delete content)
  const handleReportAction = async (reportId, action) => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    try {
      const status = action === "dismiss" ? "dismissed" : "reviewed"

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status,
          action: action === "delete" ? "delete" : "retain",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update report")
      }

      // Update local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId ? { ...report, status, reviewedAt: new Date().toISOString() } : report,
        ),
      )

      // Show success notification
      setNotification({
        type: "success",
        message:
          action === "dismiss" ? "Report dismissed successfully" : "Content deleted and report marked as reviewed",
        timestamp: new Date(),
      })

      // Refresh reports to get updated data
      fetchReports()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    // Fetch reports
    fetchReports()
  }, [filter, navigate])

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="reports" />

      <div className="admin-content flex-grow-1">
        {notification && (
          <div
            className={`alert ${notification.type === "new-report" ? "alert-info" : "alert-success"} alert-dismissible fade show m-3`}
          >
            <i className={`bi ${notification.type === "new-report" ? "bi-bell" : "bi-check-circle"} me-2`}></i>
            {notification.message}
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        )}

        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Reported Content</h4>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={filter.status}
                onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select
                className="form-select form-select-sm"
                value={filter.contentType}
                onChange={(e) => setFilter((prev) => ({ ...prev, contentType: e.target.value }))}
              >
                <option value="all">All Types</option>
                <option value="post">Posts</option>
                <option value="comment">Comments</option>
                <option value="reply">Replies</option>
              </select>
              <button className="btn btn-sm btn-outline-primary" onClick={fetchReports} title="Refresh">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <ReportedContentTable reports={reports} loading={loading} onAction={handleReportAction} />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminReports
