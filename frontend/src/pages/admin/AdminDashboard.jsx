/* eslint-disable no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import DashboardStats from "./components/DashboardStats"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])

  // Socket event handlers
  const handleNewPost = (data) => {
    // Add notification
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "new-post",
        message: `New post submitted: "${data.title}" by ${data.username}`,
        time: new Date(),
      },
      ...prev,
    ])
  }

  const handlePostStatusChange = (data) => {
    // Add notification
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "status-change",
        message: `Post "${data.title}" by ${data.username} was ${data.newStatus}`,
        time: new Date(),
      },
      ...prev,
    ])
  }

  const handleNewReport = (data) => {
    // Add notification
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "new-report",
        message: `New ${data.contentType} report: "${data.reason.substring(0, 30)}..."`,
        time: new Date(),
      },
      ...prev,
    ])

    // Refresh stats to update report counts
    fetchStats()
  }

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) {
        setError("Admin token not found")
        setLoading(false)
        return
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

      // Fetch admin stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`)
      }

      const statsData = await statsResponse.json()

      // Fetch report counts
      const reportsResponse = await fetch(`${API_BASE_URL}/api/admin/reports/count`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!reportsResponse.ok) {
        throw new Error(`Failed to fetch report counts: ${reportsResponse.status}`)
      }

      const reportsData = await reportsResponse.json()

      // Combine stats with report counts
      setStats({
        ...statsData,
        reportCounts: reportsData.count,
      })

      setLoading(false)
    } catch (err) {
      console.error("Error fetching admin stats:", err)
      setError(err.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up refresh interval for stats
    const statsInterval = setInterval(fetchStats, 60000) // Refresh every minute

    return () => {
      clearInterval(statsInterval)
    }
  }, [])

  if (loading) {
    return (
      <div className="admin-dashboard d-flex">
        <AdminSidebar activePage="dashboard" />
        <div className="admin-content flex-grow-1">
          <div className="container-fluid py-4">
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard d-flex">
        <AdminSidebar activePage="dashboard" />
        <div className="admin-content flex-grow-1">
          <div className="container-fluid py-4">
            <div className="alert alert-danger">
              <h4 className="alert-heading">Error Loading Dashboard</h4>
              <p>{error}</p>
              <hr />
              <p className="mb-0">
                Please try refreshing the page or{" "}
                <Link to="/admin/login" className="alert-link">
                  log in again
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="dashboard" />
      <div className="admin-content flex-grow-1">
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">Dashboard</h1>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchStats}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>

          <DashboardStats stats={stats} />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
