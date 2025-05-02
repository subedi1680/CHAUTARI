/* eslint-disable react/prop-types */
"use client"

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { userSession } from "../utils/sessionManager"
import { adminSession } from "../utils/sessionManager" // Import adminSession

const ProtectedRoute = ({ adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    adminOnly ? adminSession.isAuthenticated() : userSession.isAuthenticated(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = () => {
      if (adminOnly) {
        setIsAuthenticated(adminSession.isAuthenticated())
      } else {
        setIsAuthenticated(userSession.isAuthenticated())
      }
      setIsLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    window.addEventListener("storage", checkAuth)
    window.addEventListener(adminOnly ? "adminLoggedIn" : "userLoggedIn", checkAuth)
    window.addEventListener(adminOnly ? "adminLoggedOut" : "userLoggedOut", checkAuth)

    return () => {
      window.removeEventListener("storage", checkAuth)
      window.removeEventListener(adminOnly ? "adminLoggedIn" : "userLoggedIn", checkAuth)
      window.removeEventListener(adminOnly ? "adminLoggedOut" : "userLoggedOut", checkAuth)
    }
  }, [adminOnly])

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
    // Redirect to login with return path
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
