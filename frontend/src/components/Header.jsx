"use client"

import { useState, useEffect, useRef, useContext } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { userSession, adminSession, notificationManager } from "../utils/sessionManager"
import { userApi } from "../utils/apiService"
import logo from "../assets/logo-removebg.png"
import UserAvatar from "./UserAvatar"
import UserContext from "./UserContext"
import * as bootstrap from "bootstrap"
import { API_BASE_URL } from "../config"
import { useSocketStatus } from "../hooks/useSockets"

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(userSession.isAuthenticated())
  const [isAdmin, setIsAdmin] = useState(adminSession.isAuthenticated())
  const [username, setUsername] = useState(userSession.getUsername() || "")
  const [notifications, setNotifications] = useState(notificationManager.getAll())
  const [unreadCount, setUnreadCount] = useState(notificationManager.getUnreadCount())
  const [loading, setLoading] = useState(false)
  const socketRef = useRef(null)
  const notificationDropdownRef = useRef(null)
  const userDropdownRef = useRef(null)
  const { userAvatar } = useContext(UserContext)
  const [userBanStatus, setUserBanStatus] = useState(null)
  const isSocketConnected = useSocketStatus()

  // Check if current page is the landing page
  const isLandingPage = location.pathname === "/"

  // Check if current page is an admin page
  const isAdminPage = location.pathname.startsWith("/admin")

  // Add a ref to track if notifications have been fetched
  const notificationsInitializedRef = useRef(false)

  // Add this function to check ban status
  const checkUserBanStatus = async () => {
    if (!userSession.isAuthenticated()) return

    try {
      const token = userSession.getToken()
      const response = await fetch(`${API_BASE_URL}/api/users/ban-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isBanned) {
          setUserBanStatus(data)
        } else {
          setUserBanStatus(null)
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist, silently ignore
        console.log("Ban status endpoint not available")
        setUserBanStatus(null)
      } else {
        console.error("Error checking ban status:", response.statusText)
      }
    } catch (error) {
      console.error("Error checking ban status:", error)
      // Don't set any state on error to prevent UI disruption
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(userSession.isAuthenticated())
      setIsAdmin(adminSession.isAuthenticated())
      setUsername(userSession.getUsername() || "")

      // If user just logged in, fetch notifications
      if (userSession.isAuthenticated() && !notificationsInitializedRef.current) {
        fetchNotifications()
        notificationsInitializedRef.current = true
        checkUserBanStatus()
      } else if (!userSession.isAuthenticated()) {
        notificationsInitializedRef.current = false
      }
    }

    checkAuth()

    // Listen for auth changes
    window.addEventListener("userLoggedIn", checkAuth)
    window.addEventListener("userLoggedOut", checkAuth)
    window.addEventListener("adminLoggedIn", checkAuth)
    window.addEventListener("adminLoggedOut", checkAuth)
    window.addEventListener("storage", checkAuth)

    // Initialize Bootstrap dropdowns
    setTimeout(() => {
      const dropdownElementList = document.querySelectorAll(".dropdown-toggle")
      dropdownElementList.forEach((dropdownToggle) => {
        if (!bootstrap.Dropdown.getInstance(dropdownToggle)) {
          new bootstrap.Dropdown(dropdownToggle, {
            autoClose: "outside",
            boundary: "viewport",
            reference: "toggle",
          })
        }
      })
    }, 100)

    // Add click event listener to close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      // Close notification dropdown if clicked outside
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target) &&
        !event.target.closest("#notificationDropdown")
      ) {
        const dropdownElement = document.getElementById("notificationDropdown")
        if (dropdownElement) {
          const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownElement)
          if (dropdownInstance) {
            dropdownInstance.hide()
          }
        }
      }

      // Close user dropdown if clicked outside
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        !event.target.closest("#userDropdown")
      ) {
        const dropdownElement = document.getElementById("userDropdown")
        if (dropdownElement) {
          const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownElement)
          if (dropdownInstance) {
            dropdownInstance.hide()
          }
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("userLoggedIn", checkAuth)
      window.removeEventListener("userLoggedOut", checkAuth)
      window.removeEventListener("adminLoggedIn", checkAuth)
      window.removeEventListener("adminLoggedOut", checkAuth)
      window.removeEventListener("storage", checkAuth)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userSession.isAuthenticated()) return

    setLoading(true)
    try {
      const data = await userApi.getNotifications()

      // Update notifications in session storage and state
      notificationManager.setAll(data)
      setNotifications(data)
      setUnreadCount(notificationManager.getUnreadCount())
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    if (!userSession.isAuthenticated()) return

    try {
      await userApi.markNotificationAsRead(notificationId)

      // Update local state if notification was marked as read
      if (notificationManager.markAsRead(notificationId)) {
        setNotifications(notificationManager.getAll())
        setUnreadCount(notificationManager.getUnreadCount())
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userSession.isAuthenticated()) return

    try {
      await userApi.markAllNotificationsAsRead()

      // Update local state
      notificationManager.markAllAsRead()
      setNotifications(notificationManager.getAll())
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification._id)
    }

    // Navigate based on notification type
    if (notification.relatedPost) {
      navigate(`/post/${notification.relatedPost}`)
    } else if (notification.type === "system") {
      navigate("/user-settings")
    }
  }

  // Handle user logout
  const handleLogout = () => {
    userSession.clear()
    navigate("/login")
  }

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  // Don't render the header on the landing page
  if (isLandingPage) {
    return null
  }

  // Don't render header on admin pages
  if (isAdminPage) {
    return null
  }

  // Function to manually handle dropdown toggling
  const toggleDropdown = (id) => {
    const dropdownElement = document.getElementById(id)
    if (dropdownElement) {
      const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownElement)
      if (dropdownInstance) {
        dropdownInstance.toggle()
      } else {
        // If no instance exists, create one and toggle it
        const newDropdown = new bootstrap.Dropdown(dropdownElement, {
          autoClose: "outside",
          boundary: "viewport",
          reference: "toggle",
        })
        newDropdown.toggle()
      }
    }
  }

  return (
    <header className="app-header">
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light">
          <Link className="navbar-brand" to={isAuthenticated ? "/home" : "/login"}>
            <img src={logo || "/placeholder.svg"} alt="CHAUTARI" />
            <span className="fw-bold">CHAUTARI</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            {isAuthenticated && (
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className={`nav-link ${location.pathname === "/home" ? "active" : ""}`} to="/home">
                    <i className="bi bi-house-door me-2"></i>
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === "/create-post" ? "active" : ""}`}
                    to="/create-post"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Post
                  </Link>
                </li>
                {isAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin/dashboard">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Admin Panel
                    </Link>
                  </li>
                )}
              </ul>
            )}

            <div className="d-flex align-items-center ms-auto">
              {isAuthenticated ? (
                <>
                  {userBanStatus && (
                    <div className="alert alert-warning d-flex align-items-center py-1 px-2 me-3 mb-0">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div className="small">
                        <strong>Account Restricted</strong>
                      </div>
                    </div>
                  )}
                  {/* Connection Status Indicator */}
                  {!isSocketConnected && (
                    <div className="text-warning me-2" title="Connection issues detected">
                      <i className="bi bi-wifi-off"></i>
                    </div>
                  )}
                  {/* Notification Bell */}
                  <div className="dropdown me-3" ref={notificationDropdownRef}>
                    <button
                      className="btn btn-light rounded-circle position-relative p-2"
                      id="notificationDropdown"
                      onClick={() => {
                        fetchNotifications()
                        toggleDropdown("notificationDropdown")
                      }}
                    >
                      <i className="bi bi-bell fs-5"></i>
                      {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                      )}
                    </button>
                    <div
                      className="dropdown-menu dropdown-menu-end notification-dropdown"
                      aria-labelledby="notificationDropdown"
                    >
                      <div className="notification-header">
                        <h6 className="mb-0 fw-bold">Notifications</h6>
                        {unreadCount > 0 && (
                          <button className="btn btn-sm text-primary p-0" onClick={handleMarkAllAsRead}>
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="notification-list">
                        {loading ? (
                          <div className="text-center p-3">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-center p-4">
                            <i className="bi bi-bell-slash fs-4 mb-2"></i>
                            <p className="mb-0 text-muted">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`notification-item ${!notification.read ? "unread" : ""}`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="d-flex">
                                <div className="me-3">
                                  {notification.fromUser ? (
                                    <UserAvatar
                                      user={{
                                        username: notification.fromUser.username || "User",
                                        avatar: notification.fromUser.avatar,
                                      }}
                                      size="sm"
                                    />
                                  ) : (
                                    <div className={`${!notification.read ? "text-primary" : "text-muted"}`}>
                                      {notification.type === "comment" && (
                                        <i className="bi bi-chat-left-text-fill fs-5"></i>
                                      )}
                                      {notification.type === "like" && (
                                        <i className="bi bi-hand-thumbs-up-fill fs-5"></i>
                                      )}
                                      {notification.type === "reply" && <i className="bi bi-reply-fill fs-5"></i>}
                                      {notification.type === "mention" && <i className="bi bi-at fs-5"></i>}
                                      {notification.type === "system" && <i className="bi bi-gear-fill fs-5"></i>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow-1">
                                  <p className="mb-1">{notification.content}</p>
                                  <small className="text-muted">{formatNotificationTime(notification.createdAt)}</small>
                                </div>
                                {!notification.read && (
                                  <div className="ms-2">
                                    <span className="badge bg-primary rounded-circle p-1">&nbsp;</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="notification-footer">{/* Notification settings link removed */}</div>
                    </div>
                  </div>

                  {/* User Dropdown */}
                  <div className="dropdown" ref={userDropdownRef}>
                    <button
                      className="btn btn-light dropdown-toggle d-flex align-items-center rounded-pill"
                      id="userDropdown"
                      onClick={() => toggleDropdown("userDropdown")}
                    >
                      <UserAvatar
                        user={{
                          username: username,
                          avatar: userAvatar,
                        }}
                        size="sm"
                        className="me-2"
                      />
                      <span className="d-none d-md-inline">{username}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end user-dropdown" aria-labelledby="userDropdown">
                      <li>
                        <Link className="dropdown-item" to="/user-settings">
                          <i className="bi bi-gear-fill me-2"></i>
                          User Settings
                        </Link>
                      </li>
                      {userBanStatus && (
                        <li>
                          <div className="dropdown-item text-warning">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {userBanStatus.banExpiresAt
                              ? `Banned until ${new Date(userBanStatus.banExpiresAt).toLocaleDateString()}`
                              : "Permanently banned"}
                          </div>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary btn-hover-effect">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
