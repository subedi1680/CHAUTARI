// Base URLs for API and Socket
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://chautari.onrender.com"
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://chautari.onrender.com"

// Default avatar URL
export const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=random"

// Post status constants
export const POST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
}

// Report status constants
export const REPORT_STATUS = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
}

// Report types
export const REPORT_TYPES = [
  "Inappropriate content",
  "Spam",
  "Harassment",
  "Misinformation",
  "Violence",
  "Hate speech",
  "Other",
]

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10

// Notification types
export const NOTIFICATION_TYPES = {
  LIKE: "like",
  COMMENT: "comment",
  REPLY: "reply",
  FOLLOW: "follow",
  SYSTEM: "system",
}

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "chautari_auth_token",
  USER: "chautari_user",
  THEME: "chautari_theme",
  ADMIN_TOKEN: "chautari_admin_token",
  ADMIN: "chautari_admin",
}

// Theme options
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
}

// API timeout in milliseconds
export const API_TIMEOUT = 30000

// Maximum file upload size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Supported file types for uploads
export const SUPPORTED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

// Console logging in production
export const ENABLE_PRODUCTION_LOGS = false

// Feature flags
export const FEATURES = {
  NOTIFICATIONS: true,
  DARK_MODE: true,
  COMMENTS: true,
  REPLIES: true,
  REPORTS: true,
  USER_PROFILES: true,
}
