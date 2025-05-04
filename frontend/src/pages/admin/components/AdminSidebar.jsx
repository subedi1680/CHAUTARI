/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "./AdminSidebar.css"

const AdminSidebar = ({ activePage }) => {
  const [adminEmail, setAdminEmail] = useState("")
  const [adminRole, setAdminRole] = useState("")
  const [reportCount, setReportCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  // Determine active page from URL if not provided as prop
  const currentPage = activePage || location.pathname.split("/").pop()

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    setAdminEmail(sessionStorage.getItem("adminEmail") || "")
    setAdminRole(sessionStorage.getItem("adminRole") || "admin")

    // Fetch report count
    const fetchReportCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reports/count?status=pending`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setReportCount(data.count)
        }
      } catch (error) {
        console.error("Error fetching report count:", error)
      }
    }

    fetchReportCount()

    // Set up interval to refresh counts
    const interval = setInterval(fetchReportCount, 60000) // Refresh every minute

    // Cleanup
    return () => {
      clearInterval(interval)
    }
  }, [API_BASE_URL, navigate])

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminEmail")
    sessionStorage.removeItem("adminRole")
    navigate("/admin/login")
  }

  const isSuperAdmin = adminRole === "super_admin"

  // Navigation items configuration
  const navItems = [
    {
      id: "dashboard",
      path: "/admin/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      badge: null,
    },
    {
      id: "posts",
      path: "/admin/posts",
      icon: "bi-file-earmark-text",
      label: "Posts",
      badge: null,
    },
    {
      id: "reports",
      path: "/admin/reports",
      icon: "bi-flag",
      label: "Reports",
      badge: reportCount > 0 ? reportCount : null,
    },
    {
      id: "users",
      path: "/admin/users",
      icon: "bi-people",
      label: "Users",
      badge: null,
    },
    {
      id: "settings",
      path: "/admin/settings",
      icon: "bi-gear",
      label: "Settings",
      badge: null,
      superAdminOnly: true,
    },
  ]

  return (
    <div className="admin-sidebar">
      <div className="admin-info">
        <div className="admin-avatar">
          <i className="bi bi-person-circle"></i>
        </div>
        <div className="admin-details">
          <div className="admin-email">{adminEmail}</div>
          <div className="admin-role">{adminRole}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            // Skip if item is for super admin only and current user is not super admin
            if (item.superAdminOnly && !isSuperAdmin) return null

            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <Link to={item.path} className={isActive ? "active" : ""} aria-current={isActive ? "page" : undefined}>
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
