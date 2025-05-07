import { userSession, adminSession, getApiBaseUrl } from "./sessionManager"
import { API_BASE_URL } from "../config"

const API_BASE_URL_OLD = getApiBaseUrl()

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

    const url = `${API_BASE_URL_OLD}${endpoint}`

    // Set up headers with authentication
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }

    // If sending JSON data, set content type
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    try {
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
        try {
          data = await response.json()
        } catch (e) {
          console.error("Error parsing JSON response:", e)
          data = { msg: "Invalid response format" }
        }
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
    } catch (error) {
      console.error(`API request failed for ${url}:`, error)
      throw error
    }
  }

  /**
   * Make a public API request (no authentication)
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  static async fetchPublic(endpoint, options = {}) {
    const url = `${API_BASE_URL_OLD}${endpoint}`

    // Set content type for JSON requests
    const headers = { ...options.headers }
    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Parse response
      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch (e) {
          console.error("Error parsing JSON response:", e)
          data = { msg: "Invalid response format" }
        }
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
    } catch (error) {
      console.error(`API request failed for ${url}:`, error)
      throw error
    }
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
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  },

  // Update user avatar
  updateAvatar: async (formData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating avatar:", error)
      throw error
    }
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
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Special handling for 404 - might mean the endpoint isn't implemented yet
        if (response.status === 404) {
          console.warn("Notifications endpoint not found. This feature might not be implemented yet.")
          return []
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Return empty array instead of throwing to prevent UI disruption
      return []
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Special handling for 404 - might mean the endpoint isn't implemented yet
        if (response.status === 404) {
          console.warn("Mark notification endpoint not found. This feature might not be implemented yet.")
          return { success: true }
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error marking notification as read:", error)
      // Return success to prevent UI disruption
      return { success: false, error: error.message }
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Special handling for 404 - might mean the endpoint isn't implemented yet
        if (response.status === 404) {
          console.warn("Mark all notifications endpoint not found. This feature might not be implemented yet.")
          return { success: true }
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      // Return success to prevent UI disruption
      return { success: false, error: error.message }
    }
  },

  // Update user categories
  updateCategories: async (categories) => {
    try {
      const token = sessionStorage.getItem("token")
      const userId = sessionStorage.getItem("userId")
      if (!token || !userId) throw new Error("No authentication token or user ID")

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating categories:", error)
      throw error
    }
  },

  // Check user ban status
  checkBanStatus: async () => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/ban-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Special handling for 404 - might mean the endpoint isn't implemented yet
        if (response.status === 404) {
          console.warn("Ban status endpoint not found. This feature might not be implemented yet.")
          return { isBanned: false }
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error checking ban status:", error)
      // Return not banned to prevent UI disruption
      return { isBanned: false }
    }
  },
}

// Post API service
export const postApi = {
  // Get all posts
  getAllPosts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching posts:", error)
      // Return empty array to prevent UI disruption
      return []
    }
  },

  // Get user posts
  getUserPosts: async () => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user posts:", error)
      // Return empty array to prevent UI disruption
      return []
    }
  },

  // Get post by ID
  getPostById: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error)
      throw error
    }
  },

  // Create new post
  createPost: async (postData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating post:", error)
      throw error
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error)
      throw error
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error)
      throw error
    }
  },

  // Like post
  likePost: async (postId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error)
      throw error
    }
  },

  // Dislike post
  dislikePost: async (postId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error disliking post ${postId}:`, error)
      throw error
    }
  },
}

// Comment API service
export const commentApi = {
  // Get comments for a post
  getComments: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error)
      // Return empty array to prevent UI disruption
      return []
    }
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error)
      throw error
    }
  },

  // Update comment
  updateComment: async (postId, commentId, commentData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error)
      throw error
    }
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error)
      throw error
    }
  },
}

// Reply API service
export const replyApi = {
  // Add reply to comment
  addReply: async (postId, commentId, replyData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(replyData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error adding reply to comment ${commentId}:`, error)
      throw error
    }
  },

  // Update reply
  updateReply: async (postId, commentId, replyId, replyData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(replyData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error updating reply ${replyId}:`, error)
      throw error
    }
  },

  // Delete reply
  deleteReply: async (postId, commentId, replyId) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error deleting reply ${replyId}:`, error)
      throw error
    }
  },
}

// Report API service
export const reportApi = {
  // Create report
  createReport: async (reportData) => {
    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating report:", error)
      throw error
    }
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
