import { API_BASE_URL } from "../config"
import { userSession, adminSession } from "./sessionManager"

// Helper function to handle API errors
const handleApiError = async (response) => {
  if (!response.ok) {
    // Try to get error message from response
    try {
      const errorData = await response.json()
      throw new Error(errorData.msg || `API error: ${response.status}`)
    } catch (e) {
      // If parsing JSON fails, throw generic error
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
  }
  return response.json()
}

// Helper function to handle network errors
const handleNetworkError = (error) => {
  console.error("Network error:", error)
  throw new Error("Network error. Please check your connection and try again.")
}

// User API service
export const userApi = {
  // Get user profile
  getProfile: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update user avatar
  updateAvatar: async (formData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Remove user avatar
  removeAvatar: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Change user password
  changePassword: async (passwordData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user activity
  getActivity: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user's posts
  getUserPosts: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/posts`)
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get current user's posts (including pending/rejected)
  getCurrentUserPosts: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/me/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user's saved posts
  getSavedPosts: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/me/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Toggle save/unsave post
  toggleSavePost: async (postId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/posts/${postId}/save`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Check if post is saved
  checkPostSaved: async (postId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/posts/${postId}/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user's preferred categories
  getUserCategories: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/me/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update user's preferred categories
  updateUserCategories: async (categories) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/users/me/categories`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user's notifications
  getNotifications: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 404) {
        console.log("Notifications endpoint not available")
        return []
      }

      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      return []
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 404) {
        console.log("Notification read endpoint not available")
        return { success: false }
      }

      return handleApiError(response)
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return { success: false }
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 404) {
        console.log("Mark all notifications endpoint not available")
        return { success: false }
      }

      return handleApiError(response)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false }
    }
  },

  // Get user by ID (public profile)
  getUserById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching user data:", error)
      return null
    }
  },

  // Get user stats
  getUserStats: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/stats`)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching user stats:", error)
      return {
        posts: 0,
        comments: 0,
        replies: 0,
        joinDate: new Date(),
      }
    }
  },

  // Download user data
  downloadUserData: async () => {
    try {
      const token = userSession.getToken()
      const userId = userSession.getUserId()
      if (!token || !userId) throw new Error("No authentication token or user ID")

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/download-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Delete user account
  deleteAccount: async (password) => {
    try {
      const token = userSession.getToken()
      const userId = userSession.getUserId()
      if (!token || !userId) throw new Error("No authentication token or user ID")

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}

// Post API service
export const postApi = {
  // Get all posts
  getAllPosts: async (page = 1, limit = 10, category = null) => {
    try {
      let url = `${API_BASE_URL}/api/posts?page=${page}&limit=${limit}`
      if (category) {
        url += `&category=${category}`
      }

      const response = await fetch(url)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching posts:", error)
      return { posts: [], totalPages: 0 }
    }
  },

  // Get post by ID
  getPostById: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching post:", error)
      return null
    }
  },

  // Create new post
  createPost: async (postData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Like post
  likePost: async (postId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Dislike post
  dislikePost: async (postId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Report post
  reportPost: async (postId, reportData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/reports/post/${postId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}

// Comment API service
export const commentApi = {
  // Get comments for a post
  getComments: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching comments:", error)
      return []
    }
  },

  // Add comment to post
  addComment: async (postId, content) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update comment
  updateComment: async (commentId, content) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Delete comment
  deleteComment: async (commentId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Like comment
  likeComment: async (commentId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/like`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Dislike comment
  dislikeComment: async (commentId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/dislike`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Report comment
  reportComment: async (commentId, reportData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/reports/comment/${commentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}

// Reply API service
export const replyApi = {
  // Get replies for a comment
  getReplies: async (commentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`)
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching replies:", error)
      return []
    }
  },

  // Add reply to comment
  addReply: async (commentId, content) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Update reply
  updateReply: async (replyId, content) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/replies/${replyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Delete reply
  deleteReply: async (replyId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/replies/${replyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Like reply
  likeReply: async (replyId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/replies/${replyId}/like`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Dislike reply
  dislikeReply: async (replyId) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/replies/${replyId}/dislike`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Report reply
  reportReply: async (replyId, reportData) => {
    try {
      const token = userSession.getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${API_BASE_URL}/api/reports/reply/${replyId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}

// Auth API service
export const authApi = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Request password reset
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Verify email with token
  verifyEmail: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`)
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Resend verification email
  resendVerification: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}

// Admin API service
export const adminApi = {
  // Admin login
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      return {
        totalUsers: 0,
        totalPosts: 0,
        pendingPosts: 0,
        totalComments: 0,
        totalReports: 0,
      }
    }
  },

  // Get all posts (admin view)
  getAllPosts: async (page = 1, limit = 10, status = null) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      let url = `${API_BASE_URL}/api/admin/posts?page=${page}&limit=${limit}`
      if (status) {
        url += `&status=${status}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching admin posts:", error)
      return { posts: [], totalPages: 0 }
    }
  },

  // Get post by ID (admin view)
  getPostById: async (postId) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching admin post:", error)
      return null
    }
  },

  // Update post status
  updatePostStatus: async (postId, status, message = "") => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, message }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get all reports
  getAllReports: async (page = 1, limit = 10, status = null) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      let url = `${API_BASE_URL}/api/admin/reports?page=${page}&limit=${limit}`
      if (status) {
        url += `&status=${status}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching reports:", error)
      return { reports: [], totalPages: 0 }
    }
  },

  // Get report by ID
  getReportById: async (reportId) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching report:", error)
      return null
    }
  },

  // Update report status
  updateReportStatus: async (reportId, status, action = "") => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, action }),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get all users (admin view)
  getAllUsers: async (page = 1, limit = 10, query = "") => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      let url = `${API_BASE_URL}/api/admin/users?page=${page}&limit=${limit}`
      if (query) {
        url += `&query=${encodeURIComponent(query)}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching users:", error)
      return { users: [], totalPages: 0 }
    }
  },

  // Get user by ID (admin view)
  getUserById: async (userId) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  },

  // Ban user
  banUser: async (userId, banData) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(banData),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Unban user
  unbanUser: async (userId) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  // Get user activity (admin view)
  getUserActivity: async (userId) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activity`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching user activity:", error)
      return []
    }
  },

  // Get admin settings
  getSettings: async () => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return handleApiError(response)
    } catch (error) {
      console.error("Error fetching admin settings:", error)
      return {}
    }
  },

  // Update admin settings
  updateSettings: async (settings) => {
    try {
      const token = adminSession.getToken()
      if (!token) throw new Error("No admin authentication token")

      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })
      return handleApiError(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  },
}
