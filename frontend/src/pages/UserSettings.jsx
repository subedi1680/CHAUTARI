/* eslint-disable no-unused-vars */
"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as bootstrap from "bootstrap"
import UserAvatar from "../components/UserAvatar"
import UserContext from "../components/UserContext"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

function UserSettings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    bio: "",
    dateOfBirth: "",
    avatar: "",
  })
  const { updateAvatar, resetAvatar } = useContext(UserContext)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  })

  const token = sessionStorage.getItem("token")
  const userId = sessionStorage.getItem("userId")

  // Add notification state and handlers
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    comments: true,
    likes: true,
    replies: true,
  })

  const [notificationLoading, setNotificationLoading] = useState(false)
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user profile")
        }

        const userData = await response.json()

        // Format date of birth if available
        let formattedDOB = ""
        if (userData.dateOfBirth) {
          const date = new Date(userData.dateOfBirth)
          formattedDOB = date.toISOString().split("T")[0]
        }

        setUserProfile({
          username: userData.username || "",
          email: userData.email || "",
          bio: userData.bio || "",
          dateOfBirth: formattedDOB,
          avatar: userData.avatar || "",
        })

        // Set notification preferences if available
        if (userData.notificationPreferences) {
          setNotificationPreferences(userData.notificationPreferences)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast.error("Failed to load user profile")
      }
    }

    fetchUserProfile()
  }, [token, navigate])

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Validate password if it's the new password field
    if (name === "newPassword") {
      validatePasswordStrength(value)
    }

    // Check if passwords match
    if (name === "confirmPassword" || name === "newPassword") {
      const match =
        passwordData.newPassword === value || (name === "newPassword" && value === passwordData.confirmPassword)

      setPasswordErrors((prev) => ({
        ...prev,
        match,
      }))
    }
  }

  // Validate password strength
  const validatePasswordStrength = (password) => {
    setPasswordErrors({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      match: password === passwordData.confirmPassword,
    })
  }

  // Check if all password requirements are met
  const isPasswordValid = () => {
    return Object.values(passwordErrors).every(Boolean)
  }

  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("bio", userProfile.bio)

      // Add avatar if selected
      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()

      // Update local state with new avatar
      if (data.user && data.user.avatar) {
        setUserProfile((prev) => ({
          ...prev,
          avatar: data.user.avatar,
        }))

        // Store avatar in user-specific session storage
        sessionStorage.setItem(`userAvatar_${userId}`, data.user.avatar)

        // Use the context to update avatar
        if (updateAvatar) {
          updateAvatar(data.user.avatar)
        } else {
          // Fallback to direct event dispatch if context method is not available
          window.dispatchEvent(
            new CustomEvent("avatarUpdated", {
              detail: {
                avatar: data.user.avatar,
                userId: userId,
              },
            }),
          )
        }
      }

      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Add a dedicated function to handle avatar updates
  const handleAvatarUpdate = async () => {
    if (!avatarFile) {
      toast.error("Please select an image first")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update avatar")
      }

      const data = await response.json()

      // Update local state
      setUserProfile((prev) => ({
        ...prev,
        avatar: data.avatar,
      }))

      // Store in user-specific session storage
      sessionStorage.setItem(`userAvatar_${userId}`, data.avatar)

      // Use the context to update avatar
      if (updateAvatar) {
        updateAvatar(data.avatar)
      } else {
        // Fallback to direct event dispatch if context method is not available
        window.dispatchEvent(
          new CustomEvent("avatarUpdated", {
            detail: {
              avatar: data.avatar,
              userId: userId,
            },
          }),
        )
      }

      toast.success("Avatar updated successfully!")

      // Clear the file input
      setAvatarFile(null)
    } catch (error) {
      console.error("Error updating avatar:", error)
      toast.error("Failed to update avatar. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!isPasswordValid()) {
      toast.error("Please ensure your password meets all requirements")
      return
    }

    setPasswordLoading(true)

    try {
      // First verify the current password
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: passwordData.currentPassword,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error("Current password is incorrect")
      }

      // Then update the password - you'll need to create this endpoint in your backend
      const updateResponse = await fetch(`${API_BASE_URL}/api/users/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update password")
      }

      // Reset form fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast.success("Password updated successfully!")
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error(error.message || "Failed to update password. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // Add handler for notification preferences
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target
    setNotificationPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  // Add handler to save notification preferences
  const handleSaveNotificationPreferences = async () => {
    setNotificationLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationPreferences),
      })

      if (!response.ok) {
        throw new Error("Failed to update notification preferences")
      }

      toast.success("Notification preferences updated successfully!")
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      toast.error("Failed to update notification preferences")
    } finally {
      setNotificationLoading(false)
    }
  }

  // Fix the delete account modal issue by updating the modal initialization and styling
  // Add a new modal for password confirmation when downloading data

  // First, update the handleDownloadData function to show a modal instead of downloading directly
  const handleDownloadData = async () => {
    // Show the download data modal instead of downloading directly
    const downloadModal = new bootstrap.Modal(document.getElementById("downloadDataModal"))
    downloadModal.show()
  }

  // Add a new function to handle the actual download after password confirmation
  const confirmAndDownloadData = async () => {
    if (!deleteAccountPassword) {
      toast.error("Please enter your password to download your data")
      return
    }

    setDownloadLoading(true)

    try {
      // First verify the password
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deleteAccountPassword,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error("Incorrect password")
      }

      // Then download the data
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/download-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download user data")
      }

      const data = await response.json()

      // Convert to JSON string and create a downloadable file
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Create a temporary link and trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = `chautari-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Close the modal
      const downloadModal = bootstrap.Modal.getInstance(document.getElementById("downloadDataModal"))
      if (downloadModal) {
        downloadModal.hide()
      }

      // Clear the password field
      setDeleteAccountPassword("")

      toast.success("Your data has been downloaded successfully!")
    } catch (error) {
      console.error("Error downloading user data:", error)
      toast.error(error.message || "Failed to download your data")
    } finally {
      setDownloadLoading(false)
    }
  }

  // Add this function to manually initialize the modal
   
  const initializeModal = () => {
    const modalElement = document.getElementById("deleteAccountModal")
    if (modalElement) {
      return new bootstrap.Modal(modalElement)
    }
    return null
  }

  // Add handler for deleting account
  // Update the handleDeleteAccount function to properly handle the modal
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      toast.error("Please enter your password to confirm account deletion")
      return
    }

    setDeleteLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deleteAccountPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Failed to delete account")
      }

      // Clear session storage
      sessionStorage.removeItem("token")
      sessionStorage.removeItem("userId")
      sessionStorage.removeItem("username")
      sessionStorage.removeItem(`userAvatar_${userId}`)
      sessionStorage.removeItem("notifications")
      sessionStorage.removeItem("unreadCount")

      toast.success("Your account has been deleted successfully")

      // Close modal manually - first get the DOM element
      const modalElement = document.getElementById("deleteAccountModal")
      // Then get the Bootstrap modal instance
      const modalInstance = bootstrap.Modal.getInstance(modalElement)
      // If the instance exists, hide it
      if (modalInstance) {
        modalInstance.hide()
      }

      // Remove the modal backdrop manually if it's still present
      const backdrop = document.querySelector(".modal-backdrop")
      if (backdrop) {
        backdrop.remove()
      }

      // Make sure body doesn't have modal-open class
      document.body.classList.remove("modal-open")
      document.body.style.overflow = ""
      document.body.style.paddingRight = ""

      // Add a small delay before redirecting
      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(error.message || "Failed to delete account")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Add this useEffect hook to initialize Bootstrap modals
  useEffect(() => {
    // Initialize Bootstrap modals
    const deleteAccountModalEl = document.getElementById("deleteAccountModal")
    if (deleteAccountModalEl) {
      new bootstrap.Modal(deleteAccountModalEl, {
        backdrop: true,
        keyboard: true,
        focus: true,
      })
    }

    const downloadDataModalEl = document.getElementById("downloadDataModal")
    if (downloadDataModalEl) {
      new bootstrap.Modal(downloadDataModalEl, {
        backdrop: true,
        keyboard: true,
        focus: true,
      })
    }
  }, [])

  // Handle logout
  const handleLogout = () => {
    const currentUserId = sessionStorage.getItem("userId")

    // Clear user-specific avatar before clearing userId
    if (currentUserId) {
      // We don't remove the avatar from sessionStorage to allow for faster re-login
      // But we do reset the context state
      if (resetAvatar) {
        // Use the context's resetAvatar function if available
        resetAvatar()
      }
    }

    // Clear session storage
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("notifications")
    sessionStorage.removeItem("unreadCount")

    // Dispatch a userLoggedOut event to notify other components
    window.dispatchEvent(new CustomEvent("userLoggedOut"))

    setIsAuthenticated(false)
    navigate("/login")
  }

  const getVerifiedAvatar = () => {
    // Ensure we're displaying the correct user's avatar
    const currentId = sessionStorage.getItem("userId")
    if (currentId && currentId === userId) {
      if (avatarPreview) return avatarPreview
      if (userProfile.avatar) return userProfile.avatar
      return sessionStorage.getItem(`userAvatar_${currentId}`) || ""
    }
    return ""
  }

  return (
    <div className="container py-5">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-center mb-4">
                {userProfile.avatar ? (
                  <img
                    src={getVerifiedAvatar() || "/placeholder.svg"}
                    alt="User Avatar"
                    className="avatar avatar-xl mx-auto mb-3"
                  />
                ) : (
                  <UserAvatar user={userProfile} size="xl" className="mx-auto mb-3" />
                )}
                <h5 className="mb-0">{userProfile.username}</h5>
                <p className="text-muted small">{userProfile.email}</p>
              </div>

              <h5 className="card-title mb-4">Settings</h5>

              <div className="nav flex-column nav-pills">
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <i className="bi bi-person-fill me-2"></i>
                  Profile Information
                </button>
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "security" ? "active" : ""}`}
                  onClick={() => setActiveTab("security")}
                >
                  <i className="bi bi-shield-lock-fill me-2"></i>
                  Security
                </button>
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "notifications" ? "active" : ""}`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <i className="bi bi-bell-fill me-2"></i>
                  Notifications
                </button>
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "account" ? "active" : ""}`}
                  onClick={() => setActiveTab("account")}
                >
                  <i className="bi bi-gear-fill me-2"></i>
                  Account Management
                </button>
              </div>

              <div className="mt-4">
                <button className="btn btn-outline-secondary w-100" onClick={() => navigate("/home")}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9">
          {/* Profile Information Tab */}
          {activeTab === "profile" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Profile Information</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-4 text-center">
                    <div className="position-relative d-inline-block">
                      {getVerifiedAvatar() ? (
                        <img
                          src={getVerifiedAvatar() || "/placeholder.svg"}
                          alt="Avatar Preview"
                          className="avatar avatar-xl mb-3"
                        />
                      ) : (
                        <UserAvatar user={userProfile} size="xl" className="mb-3" />
                      )}
                      <label
                        htmlFor="avatar"
                        className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle"
                      >
                        <i className="bi bi-pencil"></i>
                        <span className="sr-only">Change Avatar</span>
                      </label>
                    </div>
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      accept="image/*"
                      className="d-none"
                      onChange={handleAvatarChange}
                    />
                    <div className="small text-muted mt-1">Click the pencil icon to change your avatar</div>

                    {/* Add a button to update avatar separately */}
                    {avatarFile && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary mt-2"
                        onClick={handleAvatarUpdate}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Updating Avatar...
                          </>
                        ) : (
                          <>Update Avatar</>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={userProfile.username}
                        disabled
                      />
                      <small className="text-muted">Username cannot be changed</small>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={userProfile.email}
                        disabled
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">
                      Bio
                    </label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows="3"
                      value={userProfile.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="dateOfBirth" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={userProfile.dateOfBirth}
                      disabled
                    />
                    <small className="text-muted">Date of birth cannot be changed</small>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>Save Changes</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Change Password</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 fw-medium">Password requirements:</p>
                    <ul className="list-unstyled ps-3">
                      <li className={`mb-1 ${passwordErrors.length ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.length ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least 8 characters
                      </li>
                      <li className={`mb-1 ${passwordErrors.uppercase ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.uppercase ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one uppercase letter (A-Z)
                      </li>
                      <li className={`mb-1 ${passwordErrors.lowercase ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.lowercase ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one lowercase letter (a-z)
                      </li>
                      <li className={`mb-1 ${passwordErrors.number ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.number ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one number (0-9)
                      </li>
                      <li className={`mb-1 ${passwordErrors.special ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.special ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one special character (@$!%*?&)
                      </li>
                      <li className={`${passwordErrors.match ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.match ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        Passwords match
                      </li>
                    </ul>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary" disabled={passwordLoading || !isPasswordValid()}>
                      {passwordLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Updating...
                        </>
                      ) : (
                        <>Update Password</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Notification Preferences</h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4">
                  Choose which notifications you&apos;d like to receive and how you&apos;d like to receive them.
                </p>

                <div className="mb-4">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotifications"
                      name="email"
                      checked={notificationPreferences.email}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      Email Notifications
                    </label>
                    <div className="text-muted small">Receive notifications via email</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="commentNotifications"
                      name="comments"
                      checked={notificationPreferences.comments}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="commentNotifications">
                      Comment Notifications
                    </label>
                    <div className="text-muted small">Get notified when someone comments on your posts</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="likeNotifications"
                      name="likes"
                      checked={notificationPreferences.likes}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="likeNotifications">
                      Like Notifications
                    </label>
                    <div className="text-muted small">Get notified when someone likes your posts</div>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="replyNotifications"
                      name="replies"
                      checked={notificationPreferences.replies}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="replyNotifications">
                      Reply Notifications
                    </label>
                    <div className="text-muted small">Get notified when someone replies to your comments</div>
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveNotificationPreferences}
                    disabled={notificationLoading}
                  >
                    {notificationLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>Save Preferences</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Management Tab */}
          {activeTab === "account" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Account Management</h5>
              </div>
              <div className="card-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  The actions in this section are permanent and cannot be undone.
                </div>

                <div className="mb-4">
                  <h6>Download Your Data</h6>
                  <p className="text-muted">Download a copy of all your data from CHAUTARI.</p>
                  <button className="btn btn-outline-primary" onClick={handleDownloadData}>
                    <i className="bi bi-download me-2"></i>
                    Download Data
                  </button>
                </div>

                <div className="mb-4">
                  <h6>Delete Account</h6>
                  <p className="text-muted">Permanently delete your account and all your data from CHAUTARI.</p>
                  <button
                    className="btn btn-danger"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#deleteAccountModal"
                  >
                    <i className="bi bi-trash me-2"></i>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <div
        className="modal fade"
        id="deleteAccountModal"
        tabIndex="-1"
        aria-labelledby="deleteAccountModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteAccountModalLabel">
                Delete Account
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                This action is permanent and cannot be undone.
              </div>
              <p>
                Are you sure you want to delete your account? All your data, including posts, comments, and profile
                information will be permanently removed.
              </p>
              <div className="mb-3">
                <label htmlFor="deleteConfirmPassword" className="form-label">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="deleteConfirmPassword"
                  placeholder="Your password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deleteAccountPassword}
              >
                {deleteLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-2"></i>
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Data Modal */}
      <div
        className="modal fade"
        id="downloadDataModal"
        tabIndex="-1"
        aria-labelledby="downloadDataModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="downloadDataModalLabel">
                Download Your Data
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle-fill me-2"></i>
                For security reasons, please confirm your password before downloading your data.
              </div>
              <div className="mb-3">
                <label htmlFor="downloadConfirmPassword" className="form-label">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="downloadConfirmPassword"
                  placeholder="Your password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmAndDownloadData}
                disabled={downloadLoading || !deleteAccountPassword}
              >
                {downloadLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Downloading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-download me-2"></i>
                    Download Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
