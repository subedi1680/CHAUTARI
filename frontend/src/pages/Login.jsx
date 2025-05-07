/* eslint-disable no-unused-vars */
"use client"

import { useState, useContext } from "react"
import { useNavigate, Link } from "react-router-dom"
import UserContext from "../components/UserContext"
import "bootstrap-icons/font/bootstrap-icons.css"
import { API_BASE_URL } from "../config"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { categorySetupCompleted, updateAvatar } = useContext(UserContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Invalid username or password")
      }

      const data = await response.json()
      sessionStorage.setItem("token", data.token)
      sessionStorage.setItem("userId", data.user.id)
      sessionStorage.setItem("username", username)

      // Store avatar if available
      if (data.user.avatar) {
        sessionStorage.setItem("userAvatar", data.user.avatar)

        // Update avatar in context
        if (updateAvatar) {
          updateAvatar(data.user.avatar)
        }
      }

      // Request notification permission
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission()
      }

      // Explicitly fetch notifications right after login
      try {
        const notifResponse = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        })

        if (notifResponse.ok) {
          const notifications = await notifResponse.json()
          const unreadCount = notifications.filter((n) => !n.read).length

          // Store notification data in sessionStorage for immediate access
          sessionStorage.setItem("notifications", JSON.stringify(notifications))
          sessionStorage.setItem("unreadCount", unreadCount.toString())

          // Dispatch event with the actual notification data
          window.dispatchEvent(
            new CustomEvent("userLoggedIn", {
              detail: {
                user: data.user,
                notifications: notifications,
                unreadCount: unreadCount,
              },
            }),
          )

          console.log("Dispatched userLoggedIn event with notifications:", notifications.length)
        }
      } catch (notifError) {
        console.error("Error fetching notifications during login:", notifError)
      }

      // After login, check if category setup is completed
      if (data.user.categorySetupCompleted === false) {
        // If category setup is not completed, redirect to category-setup
        navigate("/category-setup")
      } else {
        // If category setup is completed, redirect to home
        navigate("/home")
      }

      window.dispatchEvent(new Event("storage"))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-5 col-md-7 col-sm-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Welcome to CHAUTARI</h2>
                <p className="text-muted">Sign in to continue to your account</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-person-fill"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="text-primary fw-bold">
                    Sign Up
                  </Link>
                </p>
                <p className="mt-2 mb-0">
                  <Link to="/forgot-password" className="text-primary">
                    Forgot Password?
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
