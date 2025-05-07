import { userSession, adminSession, getApiBaseUrl } from "./sessionManager"

const API_BASE_URL = getApiBaseUrl()

/**
 * Generic API service for making authenticated requests
 */
class ApiService {
  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {boolean} isAdmin - Whether to use admin token
   * @returns {Promise} - Fetch promise
   */
  static async fetchWithAuth(endpoint, options = {}, isAdmin = false) {
    const token = isAdmin ? adminSession.getToken() : userSession.getToken()

    if (!token) {
      throw new Error("Authentication required")
    }

    const url = `${API_BASE_URL}${endpoint}`

    // Set up headers with authentication
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }

    // If sending JSON data, set content type
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      // Clear session
      if (isAdmin) {
        adminSession.clear()
      } else {
        userSession.clear()
      }

      throw new Error("Session expired. Please log in again.")
    }

    // Parse response
    let data
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      const error = new Error(data.msg || "API request failed")
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }

  /**
   * Make a public API request (no authentication)
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  static async fetchPublic(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    // Set content type for JSON requests
    const headers = { ...options.headers }
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Parse response
    let data
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      const error = new Error(data.msg || "API request failed")
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }
}

/**
 * User API service
 */
export const userApi = {
  // Authentication
  login: async (username, password) => {
    const data = await ApiService.fetchPublic("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    // Store token and user data
    userSession.setToken(data.token, data.user)

    return data
  },

  register: async (userData) => {
    return ApiService.fetchPublic("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  sendOtp: async (email, username, password) => {
    return ApiService.fetchPublic("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    })
  },

  verifyOtp: async (email, otp) => {
    return ApiService.fetchPublic("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    })
  },

  forgotPassword: async (email) => {
    return ApiService.fetchPublic("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  resetPassword: async (email, otp, newPassword) => {
    return ApiService.fetchPublic("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    })
  },

  // User profile
  getProfile: async () => {
    return ApiService.fetchWithAuth("/api/users/me")
  },

  updateProfile: async (userData) => {
    return ApiService.fetchWithAuth("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  },

  updateAvatar: async (formData) => {
    return ApiService.fetchWithAuth("/api/users/avatar", {
      method: "PUT",
      body: formData, // FormData for file upload
    })
  },

  // Posts
  getPosts: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/api/posts${queryString ? `?${queryString}` : ""}`

    return ApiService.fetchWithAuth(endpoint)
  },

  getPost: async (postId) => {
    return ApiService.fetchWithAuth(`/api/posts/${postId}`)
  },

  createPost: async (formData) => {
    return ApiService.fetchWithAuth("/api/posts", {
      method: "POST",
      body: formData, // FormData for file upload
    })
  },

  updatePost: async (postId, formData) => {
    return ApiService.fetchWithAuth(`/api/posts/${postId}`, {
      method: "PUT",
      body: formData, // FormData for file upload
    })
  },

  deletePost: async (postId) => {
    return ApiService.fetchWithAuth(`/api/posts/${postId}`, {
      method: "DELETE",
    })
  },

  // Comments
  getComments: async (postId) => {
    return ApiService.fetchWithAuth(`/api/posts/${postId}/comments`)
  },

  addComment: async (postId, content) => {
    return ApiService.fetchWithAuth(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
  },

  // Notifications
  getNotifications: async () => {
    return ApiService.fetchWithAuth("/api/notifications")
  },

  markNotificationAsRead: async (notificationId) => {
    return ApiService.fetchWithAuth(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    })
  },

  markAllNotificationsAsRead: async () => {
    return ApiService.fetchWithAuth("/api/notifications/read-all", {
      method: "PUT",
    })
  },
}

/**
 * Admin API service
 */
export const adminApi = {
  // Authentication
  sendOtp: async (email) => {
    return ApiService.fetchPublic("/api/admin/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  verifyOtp: async (email, otp) => {
    const data = await ApiService.fetchPublic("/api/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    })

    // Store token and admin data
    adminSession.setToken(data.token, data.admin)

    return data
  },

  // Posts management
  getPendingPosts: async () => {
    return ApiService.fetchWithAuth("/api/admin/posts/pending", {}, true)
  },

  getAllPosts: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/api/admin/posts${queryString ? `?${queryString}` : ""}`

    return ApiService.fetchWithAuth(endpoint, {}, true)
  },

  getPost: async (postId) => {
    return ApiService.fetchWithAuth(`/api/admin/posts/${postId}`, {}, true)
  },

  approvePost: async (postId) => {
    return ApiService.fetchWithAuth(
      `/api/admin/posts/${postId}/approve`,
      {
        method: "PUT",
      },
      true,
    )
  },

  rejectPost: async (postId, reason) => {
    return ApiService.fetchWithAuth(
      `/api/admin/posts/${postId}/reject`,
      {
        method: "PUT",
        body: JSON.stringify({ reason }),
      },
      true,
    )
  },

  // Admin management
  getStats: async () => {
    return ApiService.fetchWithAuth("/api/admin/stats", {}, true)
  },

  getAllAdmins: async () => {
    return ApiService.fetchWithAuth("/api/admin/all", {}, true)
  },

  addAdmin: async (email, role) => {
    return ApiService.fetchWithAuth(
      "/api/admin/add",
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      },
      true,
    )
  },

  removeAdmin: async (adminId) => {
    return ApiService.fetchWithAuth(
      `/api/admin/${adminId}`,
      {
        method: "DELETE",
      },
      true,
    )
  },
}
