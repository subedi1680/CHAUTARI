"use client"

import { useState, useEffect, useRef, useContext } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/logo-removebg.png"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import * as bootstrap from "bootstrap"
import { io } from "socket.io-client"
import UserAvatar from "./UserAvatar"
import UserContext from "./UserContext"

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("token"))
  const [username, setUsername] = useState(sessionStorage.getItem("username") || "")
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const socketRef = useRef(null)
  const notificationDropdownRef = useRef(null)
  const userDropdownRef = useRef(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState("")
  const notificationFetchedRef = useRef(false)
  const { userAvatar } = useContext(UserContext)
  // eslint-disable-next-line no-unused-vars
  const userId = sessionStorage.getItem("userId")

  // Add this near the top of the component, after the existing state declarations
  const [currentUserId, setCurrentUserId] = useState(sessionStorage.getItem("userId"))

  // Get user-specific avatar
  const getUserAvatar = () => {
    // First try to get from context as it's most up-to-date
    if (userAvatar) return userAvatar

    // Then try to get from session storage with current user ID
    const currentId = sessionStorage.getItem("userId")
    if (currentId) {
      const storedAvatar = sessionStorage.getItem(`userAvatar_${currentId}`)
      if (storedAvatar) return storedAvatar
    }

    // Default to empty string if no avatar found
    return ""
  }

  // Check if current page is the landing page
  const isLandingPage = location.pathname === "/"

  // Add a ref to track if notifications have been fetched after login
  const notificationsInitializedRef = useRef(false)

  // Function to check for stored notifications in sessionStorage
  const checkStoredNotifications = () => {
    const storedNotifications = sessionStorage.getItem("notifications")
    const storedUnreadCount = sessionStorage.getItem("unreadCount")

    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        setNotifications(parsedNotifications)

        if (storedUnreadCount) {
          setUnreadCount(Number.parseInt(storedUnreadCount, 10))
        } else {
          // Calculate unread count if not stored
          const unread = parsedNotifications.filter((n) => !n.read).length
          setUnreadCount(unread)
        }

        return true
      } catch (e) {
        console.error("Error parsing stored notifications:", e)
      }
    }
    return false
  }

  useEffect(() => {
    // Update currentUserId when it changes in sessionStorage
    const newUserId = sessionStorage.getItem("userId")
    if (newUserId !== currentUserId) {
      setCurrentUserId(newUserId)
    }

    // Listen for user login/logout events
    const handleUserChange = () => {
      const newId = sessionStorage.getItem("userId")
      setCurrentUserId(newId)
    }

    window.addEventListener("storage", handleUserChange)
    window.addEventListener("userLoggedIn", handleUserChange)
    window.addEventListener("userLoggedOut", handleUserChange)

    return () => {
      window.removeEventListener("storage", handleUserChange)
      window.removeEventListener("userLoggedIn", handleUserChange)
      window.removeEventListener("userLoggedOut", handleUserChange)
    }
  }, [currentUserId])

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("token")
      const wasAuthenticated = isAuthenticated
      setIsAuthenticated(!!token)
      setUsername(sessionStorage.getItem("username") || "")

      // If user just logged in, fetch notifications and connect to socket
      if (!!token && !wasAuthenticated) {
        console.log("User just logged in, checking for notifications...")

        // First check if notifications were already fetched during login
        if (!checkStoredNotifications()) {
          // If not in sessionStorage, fetch them
          fetchNotifications()
        }

        connectToSocket()
        notificationsInitializedRef.current = true
      } else if (!!token && !notificationsInitializedRef.current) {
        // If user is already logged in but notifications haven't been fetched yet
        console.log("User already logged in, initializing notifications...")

        // First check if notifications were already fetched during login
        if (!checkStoredNotifications()) {
          // If not in sessionStorage, fetch them
          fetchNotifications()
        }

        connectToSocket()
        notificationsInitializedRef.current = true
      } else if (!token && socketRef.current) {
        // Disconnect socket if not authenticated
        socketRef.current.disconnect()
        notificationsInitializedRef.current = false
      }
    }

    checkAuth()
    window.addEventListener("storage", checkAuth)

    // Add event listener for login events with improved handling
    const handleUserLoggedIn = (event) => {
      console.log("Login event detected with data:", event.detail)

      // If notifications were included in the event, use them
      if (event.detail && event.detail.notifications) {
        setNotifications(event.detail.notifications)
        setUnreadCount(event.detail.unreadCount || 0)
        notificationFetchedRef.current = true

        // Show notification if there are unread items
        if (event.detail.unreadCount > 0 && "Notification" in window && Notification.permission === "granted") {
          new Notification("CHAUTARI", {
            body: `You have ${event.detail.unreadCount} unread notification${event.detail.unreadCount > 1 ? "s" : ""}`,
            icon: logo,
          })
        }
      } else {
        // Otherwise fetch them
        fetchNotifications()
      }
    }

    window.addEventListener("userLoggedIn", handleUserLoggedIn)

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
      window.removeEventListener("storage", checkAuth)
      window.removeEventListener("userLoggedIn", handleUserLoggedIn)
      document.removeEventListener("mousedown", handleClickOutside)
      // Disconnect socket on unmount
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    // Initialize Bootstrap dropdowns
    if (isAuthenticated) {
      // Use a small timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        const dropdownElementList = document.querySelectorAll(".dropdown-toggle")
        dropdownElementList.forEach((dropdownToggle) => {
          // Check if a dropdown instance already exists
          if (!bootstrap.Dropdown.getInstance(dropdownToggle)) {
            // Create a new dropdown instance with explicit configuration
            new bootstrap.Dropdown(dropdownToggle, {
              autoClose: "outside", // Close when clicking outside
              boundary: "viewport",
              reference: "toggle",
            })
          }
        })
      }, 100)
    }
  }, [isAuthenticated])

  // Add a new function to manually handle dropdown toggling
  const toggleDropdown = (id) => {
    const dropdownElement = document.getElementById(id)
    if (dropdownElement) {
      const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownElement)
      if (dropdownInstance) {
        dropdownInstance.toggle()
      } else {
        // If no instance exists, create one and toggle it
        const newDropdown = new bootstrap.Dropdown(dropdownElement, {
          autoClose: "outside", // Close when clicking outside
          boundary: "viewport",
          reference: "toggle",
        })
        newDropdown.toggle()
      }
    }
  }

  // Update the connectToSocket function for better reliability and faster notifications
  const connectToSocket = () => {
    const userId = sessionStorage.getItem("userId")
    if (!userId) return

    // Disconnect existing socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    // Connect to socket with userId for private notifications
    socketRef.current = io(API_BASE_URL, {
      query: { userId },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    // Handle connection events
    socketRef.current.on("connect", () => {
      console.log("Socket connected with ID:", socketRef.current.id)
    })

    socketRef.current.on("socketConnected", (data) => {
      console.log("Socket connection confirmed by server:", data)
    })

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // Listen for new notifications with improved handling
    socketRef.current.on("newNotification", (notification) => {
      console.log("Received new notification:", notification)

      // Update notifications state immediately
      setNotifications((prev) => {
        // Check if notification already exists to prevent duplicates
        const exists = prev.some((n) => n._id === notification._id)
        if (exists) return prev
        return [notification, ...prev]
      })

      // Update unread count
      setUnreadCount((prev) => prev + 1)

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("CHAUTARI", {
          body: notification.content,
          icon: logo,
        })
      }
    })

    // Listen for content deletion events to update UI accordingly
    socketRef.current.on("postDeleted", ({ postId }) => {
      // Remove notifications related to this post
      setNotifications((prev) => prev.filter((n) => n.relatedPost !== postId))
      // Update unread count
      updateUnreadCount()
    })

    socketRef.current.on("deleteComment", ({ commentId }) => {
      // Remove notifications related to this comment
      setNotifications((prev) => prev.filter((n) => n.relatedComment !== commentId))
      // Update unread count
      updateUnreadCount()
    })

    socketRef.current.on("deleteReply", ({ commentId }) => {
      // Remove notifications related to this comment (which includes the reply)
      setNotifications((prev) => prev.filter((n) => n.relatedComment !== commentId))
      // Update unread count
      updateUnreadCount()
    })
  }

  // Add this helper function to recalculate unread count
  const updateUnreadCount = () => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }

  const fetchNotifications = async () => {
    const token = sessionStorage.getItem("token")
    if (!token) return

    setLoading(true)
    try {
      console.log("Fetching notifications from API...")
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch notifications")

      const data = await response.json()
      console.log("Fetched notifications:", data.length)

      // Store in session storage for persistence
      sessionStorage.setItem("notifications", JSON.stringify(data))

      setNotifications(data)

      // Count unread notifications
      const unread = data.filter((notification) => !notification.read).length
      sessionStorage.setItem("unreadCount", unread.toString())
      setUnreadCount(unread)

      // If there are unread notifications, show a browser notification
      if (unread > 0 && "Notification" in window && Notification.permission === "granted") {
        new Notification("CHAUTARI", {
          body: `You have ${unread} unread notification${unread > 1 ? "s" : ""}`,
          icon: logo,
        })
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    const token = sessionStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to mark notification as read")

      // Update local state
      const updatedNotifications = notifications.map((notification) =>
        notification._id === notificationId ? { ...notification, read: true } : notification,
      )

      setNotifications(updatedNotifications)

      // Update session storage
      sessionStorage.setItem("notifications", JSON.stringify(updatedNotifications))

      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - 1)
      setUnreadCount(newUnreadCount)
      sessionStorage.setItem("unreadCount", newUnreadCount.toString())
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    const token = sessionStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to mark all notifications as read")

      // Update local state
      const updatedNotifications = notifications.map((notification) => ({ ...notification, read: true }))
      setNotifications(updatedNotifications)

      // Update session storage
      sessionStorage.setItem("notifications", JSON.stringify(updatedNotifications))
      sessionStorage.setItem("unreadCount", "0")

      // Reset unread count
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read
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

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("userAvatar")
    sessionStorage.removeItem("notifications")
    sessionStorage.removeItem("unreadCount")
    setIsAuthenticated(false)
    navigate("/login")
  }

  const path = location.pathname
  const isLoginPage = ["/login"].includes(path)
  const isRegisterPage = path === "/register"
  const isForgotPasswordPage = path === "/forgot-password"
  const isAuthPage = isLoginPage || isRegisterPage || isForgotPasswordPage

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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <Link
          className="navbar-brand d-flex align-items-center"
          to={isAuthenticated ? "/home" : isAuthPage ? "/" : "/login"}
        >
          <img src={logo || "/placeholder.svg"} alt="CHAUTARI" height="40" className="me-2" />
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
          {isAuthenticated && !isAuthPage && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className={`nav-link ${path === "/home" ? "active" : ""}`} to="/home">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${path === "/create-post" ? "active" : ""}`} to="/create-post">
                  Create Post
                </Link>
              </li>
            </ul>
          )}

          <div className="d-flex ms-auto">
            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                {/* Notification Bell */}
                <div className="dropdown me-3" ref={notificationDropdownRef}>
                  <button
                    className="btn btn-primary position-relative"
                    type="button"
                    id="notificationDropdown"
                    onClick={() => {
                      fetchNotifications()
                      toggleDropdown("notificationDropdown")
                    }}
                    aria-expanded="false"
                  >
                    <i className="bi bi-bell-fill fs-5"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount > 9 ? "9+" : unreadCount}
                        <span className="visually-hidden">unread notifications</span>
                      </span>
                    )}
                  </button>
                  <div
                    className="dropdown-menu dropdown-menu-end p-0 overflow-hidden"
                    aria-labelledby="notificationDropdown"
                    style={{ width: "320px", maxHeight: "400px" }}
                  >
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
                      <h6 className="mb-0">Notifications</h6>
                      {unreadCount > 0 && (
                        <button className="btn btn-sm btn-link text-decoration-none" onClick={handleMarkAllAsRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="overflow-auto" style={{ maxHeight: "350px" }}>
                      {loading ? (
                        <div className="text-center p-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center p-3 text-muted">
                          <i className="bi bi-bell-slash fs-4 mb-2"></i>
                          <p className="mb-0">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`dropdown-item p-3 border-bottom ${!notification.read ? "bg-light" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="d-flex">
                              <div className={`me-3 ${!notification.read ? "text-primary" : "text-muted"}`}>
                                {notification.type === "comment" && <i className="bi bi-chat-left-text-fill fs-5"></i>}
                                {notification.type === "like" && <i className="bi bi-hand-thumbs-up-fill fs-5"></i>}
                                {notification.type === "reply" && <i className="bi bi-reply-fill fs-5"></i>}
                                {notification.type === "mention" && <i className="bi bi-at fs-5"></i>}
                                {notification.type === "system" && <i className="bi bi-gear-fill fs-5"></i>}
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

                    <div className="p-2 text-center border-top">
                      <Link
                        to="/user-settings"
                        className="btn btn-sm btn-link text-decoration-none"
                        onClick={() => setActiveTab("notifications")}
                      >
                        Notification Settings
                      </Link>
                    </div>
                  </div>
                </div>

                {/* User Dropdown */}
                <div className="dropdown" ref={userDropdownRef}>
                  <button
                    className="btn btn-primary dropdown-toggle d-flex align-items-center"
                    type="button"
                    id="userDropdown"
                    onClick={() => toggleDropdown("userDropdown")}
                    aria-expanded="false"
                  >
                    <UserAvatar
                      user={{
                        username: username,
                        avatar: getUserAvatar(),
                      }}
                      size="sm"
                      className="me-2"
                    />
                    <span className="d-none d-md-inline">{username}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <Link className="dropdown-item" to="/user-settings">
                        <i className="bi bi-gear-fill me-2"></i>
                        User Settings
                      </Link>
                    </li>
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
              </div>
            ) : (
              !isAuthPage && (
                <Link to="/login" className="btn btn-outline-light">
                  Login
                </Link>
              )
            )}

            {isLoginPage && (
              <Link to="/register" className="btn btn-outline-light">
                Sign Up
              </Link>
            )}

            {isRegisterPage && (
              <Link to="/login" className="btn btn-outline-light">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Header
