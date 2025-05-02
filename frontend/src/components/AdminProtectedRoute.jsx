/* eslint-disable react/prop-types */
"use client"

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { adminSession } from "../utils/sessionManager"

const AdminProtectedRoute = ({ superAdminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(adminSession.isAuthenticated())
  const [hasRequiredRole, setHasRequiredRole] = useState(!superAdminOnly || adminSession.isSuperAdmin())
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = adminSession.isAuthenticated()
      setIsAuthenticated(isAuth)

      // Check role if super admin only route
      if (superAdminOnly) {
        setHasRequiredRole(adminSession.isSuperAdmin())
      } else {
        setHasRequiredRole(true)
      }

      setIsLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    window.addEventListener("storage", checkAuth)
    window.addEventListener("adminLoggedIn", checkAuth)
    window.addEventListener("adminLoggedOut", checkAuth)

    return () => {
      window.removeEventListener("storage", checkAuth)
      window.removeEventListener("adminLoggedIn", checkAuth)
      window.removeEventListener("adminLoggedOut", checkAuth)
    }
  }, [superAdminOnly])

  if (isLoading) {
    // Show loading spinner while checking authentication
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to admin login
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!hasRequiredRole) {
    // Redirect to admin dashboard with insufficient permissions
    return <Navigate to="/admin/dashboard" state={{ permissionDenied: true }} replace />
  }

  return <Outlet />
}

export default AdminProtectedRoute
