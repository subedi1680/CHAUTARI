/* eslint-disable react/prop-types */
"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

const AdminSidebar = ({ activePage }) => {
  const [reportCount, setReportCount] = useState(0)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  const adminRole = sessionStorage.getItem("adminRole")
  const isSuperAdmin = adminRole === "super_admin"

  useEffect(() => {
    const fetchCounts = async () => {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) {
        navigate("/admin/login")
        return
      }

      try {
        // Fetch reports count
        const reportsResponse = await fetch(`${API_BASE_URL}/api/admin/reports/count?status=pending`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json()
          setReportCount(reportsData.count)
        }
      } catch (error) {
        console.error("Error fetching counts:", error)
      }
    }

    fetchCounts()
    // Set up interval to refresh counts
    const interval = setInterval(fetchCounts, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [API_BASE_URL, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminEmail")
    sessionStorage.removeItem("adminRole")
    navigate("/admin/login")
  }

  return (
    <div className="admin-sidebar bg-dark text-white">
      <div className="sidebar-header p-3">
        <h5 className="mb-0">Admin Panel</h5>
      </div>
      <div className="sidebar-menu">
        <Link
          to="/admin/dashboard"
          className={`sidebar-item d-flex align-items-center ${activePage === "dashboard" ? "active" : ""}`}
        >
          <i className="bi bi-speedometer2 me-3"></i>
          Dashboard
        </Link>

        <Link
          to="/admin/posts"
          className={`sidebar-item d-flex align-items-center ${activePage === "posts" ? "active" : ""}`}
        >
          <i className="bi bi-file-earmark-text me-3"></i>
          Manage Posts
        </Link>

        <Link
          to="/admin/reports"
          className={`sidebar-item d-flex align-items-center ${activePage === "reports" ? "active" : ""}`}
        >
          <i className="bi bi-flag me-3"></i>
          Reported Content
          {reportCount > 0 && <span className="badge bg-danger ms-auto">{reportCount}</span>}
        </Link>

        {isSuperAdmin && (
          <Link
            to="/admin/settings"
            className={`sidebar-item d-flex align-items-center ${activePage === "settings" ? "active" : ""}`}
          >
            <i className="bi bi-gear me-3"></i>
            Settings
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="sidebar-item d-flex align-items-center border-0 bg-transparent w-100 text-start"
        >
          <i className="bi bi-box-arrow-right me-3"></i>
          Logout
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
