/**
 * Session management utility for CHAUTARI
 * Centralizes all session-related operations
 */

// User session management
export const userSession = {
  // Get user token
  getToken: () => sessionStorage.getItem("token"),

  // Set user token and related data
  setToken: (token, userData) => {
    sessionStorage.setItem("token", token)
    if (userData) {
      sessionStorage.setItem("userId", userData.id)
      sessionStorage.setItem("username", userData.username)

      // Dispatch login event for components to react
      window.dispatchEvent(
        new CustomEvent("userLoggedIn", {
          detail: userData,
        }),
      )
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => !!sessionStorage.getItem("token"),

  // Get user ID
  getUserId: () => sessionStorage.getItem("userId"),

  // Get username
  getUsername: () => sessionStorage.getItem("username"),

  // Set user avatar
  setAvatar: (avatar) => {
    const userId = sessionStorage.getItem("userId")
    if (userId && avatar) {
      sessionStorage.setItem(`userAvatar_${userId}`, avatar)
    }
  },

  // Get user avatar
  getAvatar: () => {
    const userId = sessionStorage.getItem("userId")
    return userId ? sessionStorage.getItem(`userAvatar_${userId}`) : null
  },

  // Clear user session
  clear: () => {
    const wasLoggedIn = !!sessionStorage.getItem("token")

    // Clear all user-related items
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("notifications")
    sessionStorage.removeItem("unreadCount")

    // Clear user avatar
    const userId = sessionStorage.getItem("userId")
    if (userId) {
      sessionStorage.removeItem(`userAvatar_${userId}`)
    }

    // Dispatch logout event if user was logged in
    if (wasLoggedIn) {
      window.dispatchEvent(new Event("userLoggedOut"))
    }

    return wasLoggedIn
  },
}

// Admin session management
export const adminSession = {
  // Get admin token
  getToken: () => sessionStorage.getItem("adminToken"),

  // Set admin token and related data
  setToken: (token, adminData) => {
    sessionStorage.setItem("adminToken", token)
    if (adminData) {
      sessionStorage.setItem("adminId", adminData.id)
      sessionStorage.setItem("adminEmail", adminData.email)
      sessionStorage.setItem("adminRole", adminData.role)

      // Dispatch login event
      window.dispatchEvent(
        new CustomEvent("adminLoggedIn", {
          detail: adminData,
        }),
      )
    }
  },

  // Check if admin is authenticated
  isAuthenticated: () => !!sessionStorage.getItem("adminToken"),

  // Get admin role
  getRole: () => sessionStorage.getItem("adminRole"),

  // Check if admin is super admin
  isSuperAdmin: () => sessionStorage.getItem("adminRole") === "super_admin",

  // Clear admin session
  clear: () => {
    const wasLoggedIn = !!sessionStorage.getItem("adminToken")

    sessionStorage.removeItem("adminToken")
    sessionStorage.removeItem("adminId")
    sessionStorage.removeItem("adminEmail")
    sessionStorage.removeItem("adminRole")

    // Dispatch logout event if admin was logged in
    if (wasLoggedIn) {
      window.dispatchEvent(new Event("adminLoggedOut"))
    }

    return wasLoggedIn
  },
}

// Notification management
export const notificationManager = {
  // Get all notifications
  getAll: () => {
    const stored = sessionStorage.getItem("notifications")
    return stored ? JSON.parse(stored) : []
  },

  // Set notifications
  setAll: (notifications) => {
    sessionStorage.setItem("notifications", JSON.stringify(notifications))

    // Update unread count
    const unreadCount = notifications.filter((n) => !n.read).length
    sessionStorage.setItem("unreadCount", unreadCount.toString())

    return unreadCount
  },

  // Get unread count
  getUnreadCount: () => {
    return Number.parseInt(sessionStorage.getItem("unreadCount") || "0", 10)
  },

  // Add a new notification
  addNotification: (notification) => {
    const notifications = notificationManager.getAll()

    // Check if notification already exists to prevent duplicates
    const exists = notifications.some((n) => n._id === notification._id)
    if (!exists) {
      notifications.unshift(notification)
      notificationManager.setAll(notifications)
    }

    return !exists
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    const notifications = notificationManager.getAll()
    let updated = false

    const updatedNotifications = notifications.map((notification) => {
      if (notification._id === notificationId && !notification.read) {
        updated = true
        return { ...notification, read: true }
      }
      return notification
    })

    if (updated) {
      notificationManager.setAll(updatedNotifications)
    }

    return updated
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    const notifications = notificationManager.getAll()
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true,
    }))

    notificationManager.setAll(updatedNotifications)
    return updatedNotifications.length
  },
}

// API URL management
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}
