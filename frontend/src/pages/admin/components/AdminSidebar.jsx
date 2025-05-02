/* eslint-disable react/prop-types */
"use client"

import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

const AdminSidebar = ({ activePage }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const navigate = useNavigate()
  const adminRole = sessionStorage.getItem("adminRole")
  const isSuperAdmin = adminRole === "super_admin"

  useEffect(() => {
    // Check for mobile view
    const handleResize = () => {
      setCollapsed(window.innerWidth < 992)
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Fetch report count
    fetchReportCount()

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const fetchReportCount = async () => {
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) return

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/count`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReportCount(data.count)
        sessionStorage.setItem("adminReportCount", data.count.toString())
      }
    } catch (error) {
      console.error("Error fetching report count:", error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminEmail")
    sessionStorage.removeItem("adminRole")
    navigate("/admin/login")
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between p-3">
          {!collapsed && <h5 className="mb-0 text-white">Admin Panel</h5>}
          <button className="btn btn-sm btn-light rounded-circle" onClick={toggleSidebar}>
            <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
          </button>
        </div>
      </div>

      <ul className="nav flex-column p-3">
        <li className="nav-item mb-2">
          <a
            href="/admin/dashboard"
            className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
            title="Dashboard"
          >
            <i className="bi bi-speedometer2 me-2"></i>
            {!collapsed && <span>Dashboard</span>}
          </a>
        </li>
        <li className="nav-item mb-2">
          <a href="/admin/posts" className={`nav-link ${activePage === "posts" ? "active" : ""}`} title="Manage Posts">
            <i className="bi bi-file-earmark-text me-2"></i>
            {!collapsed && <span>Manage Posts</span>}
          </a>
        </li>
        <li className="nav-item mb-2">
          <a
            href="/admin/reports"
            className={`nav-link ${activePage === "reports" ? "active" : ""} position-relative`}
            title="Reported Content"
          >
            <i className="bi bi-flag me-2"></i>
            {!collapsed && <span>Reported Content</span>}
            {reportCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {reportCount}
              </span>
            )}
          </a>
        </li>
        {isSuperAdmin && (
          <li className="nav-item mb-2">
            <a
              href="/admin/settings"
              className={`nav-link ${activePage === "settings" ? "active" : ""}`}
              title="Settings"
            >
              <i className="bi bi-gear me-2"></i>
              {!collapsed && <span>Settings</span>}
            </a>
          </li>
        )}
        <li className="nav-item mt-4">
          <button
            onClick={handleLogout}
            className="nav-link text-white border-0 bg-transparent w-100 text-start"
            title="Logout"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            {!collapsed && <span>Logout</span>}
          </button>
        </li>
      </ul>
    </div>
  )
}

export default AdminSidebar
