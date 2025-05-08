/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
"use client"

import React, { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as bootstrap from "bootstrap"
import UserAvatar from "../components/UserAvatar"
import UserContext from "../components/UserContext"
import { categoryStructure } from "../utils/categoryData"
import { io } from "socket.io-client"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

function UserSettings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  // Remove bio from the userProfile state
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    avatar: "",
  })
  const { updateAvatar, resetAvatar } = useContext(UserContext)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [userAvatar, setUserAvatar] = useState(null)

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

  // Add back the missing state variables
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  // Add state for user's own posts and comments
  const [userPosts, setUserPosts] = useState([])
  const [postStats, setPostStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  })

  // Add this useEffect to fetch user categories
  const [userCategories, setUserCategories] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isEditingCategories, setIsEditingCategories] = useState(false)

  // Add state for comment count
  const [commentCount, setCommentCount] = useState(0)

  // Initialize socket
  const [socket, setSocket] = useState(null)

  // Add socket initialization effect
  useEffect(() => {
    if (token) {
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
        auth: {
          token: token,
        },
      })

      newSocket.on("connect", () => {
        console.log("Socket connected in UserSettings")
      })

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected in UserSettings")
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [token])

  // Add this function to handle category selection
  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    )
  }

  // Add this function to handle category save
  const handleSaveCategories = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category")
      return
    }

    setCategoryLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: selectedCategories }),
      })

      if (!response.ok) {
        throw new Error("Failed to update categories")
      }

      setUserCategories(selectedCategories)
      setIsEditingCategories(false)
      toast.success("Categories updated successfully!")
    } catch (error) {
      console.error("Error updating categories:", error)
      toast.error("Failed to update categories. Please try again.")
    } finally {
      setCategoryLoading(false)
    }
  }

  // Add this function to handle edit mode
  const handleEditCategories = () => {
    setSelectedCategories(userCategories)
    setIsEditingCategories(true)
  }

  // Add this function to handle cancel edit
  const handleCancelEdit = () => {
    setSelectedCategories(userCategories)
    setIsEditingCategories(false)
  }

  // Add this useEffect to initialize selected categories when userCategories changes
  useEffect(() => {
    setSelectedCategories(userCategories)
  }, [userCategories])

  // Add this useEffect to fetch user categories
  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const userData = await response.json()
          setUserCategories(userData.categories || [])
        }
      } catch (error) {
        console.error("Error fetching user categories:", error)
      }
    }

    fetchUserCategories()
  }, [token])

  // Add this to fetch user's own posts including pending ones
  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch your posts")
      }

      const data = await response.json()
      setUserPosts(data)

      // Count posts by status
      const pending = data.filter((post) => post.status === "pending").length
      const approved = data.filter((post) => post.status === "approved").length
      const rejected = data.filter((post) => post.status === "rejected").length

      setPostStats({ pending, approved, rejected, total: data.length })
    } catch (error) {
      console.error("Error fetching user posts:", error)
    }
  }

  // Fetch user profile data
  // Remove bio from the fetchUserProfile function
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

        setUserProfile({
          username: userData.username || "",
          email: userData.email || "",
          avatar: userData.avatar || "",
        })
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
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append("avatar", file)

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
        }

        // Dispatch event for global avatar update
        window.dispatchEvent(
          new CustomEvent("avatarUpdated", {
            detail: {
              avatar: data.avatar,
              userId: userId,
            },
          }),
        )

        toast.success("Avatar updated successfully!")
      } catch (error) {
        console.error("Error updating avatar:", error)
        toast.error("Failed to update avatar. Please try again.")
      } finally {
        setLoading(false)
      }
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
  // Remove bio from the handleProfileSubmit function
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()

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

  // Add back the missing handlers
  const handleDownloadData = () => {
    // Reset the password field
    setDeleteAccountPassword("")

    // Show the download data modal
    const downloadModal = document.getElementById("downloadDataModal")
    if (downloadModal) {
      const bsModal = new bootstrap.Modal(downloadModal)
      bsModal.show()
    }
  }

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
      const downloadModal = document.getElementById("downloadDataModal")
      if (downloadModal) {
        const bsModal = bootstrap.Modal.getInstance(downloadModal)
        if (bsModal) {
          bsModal.hide()
        }
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

      // Close modal
      const deleteModal = document.getElementById("deleteAccountModal")
      if (deleteModal) {
        const bsModal = bootstrap.Modal.getInstance(deleteModal)
        if (bsModal) {
          bsModal.hide()
        }
      }

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
      new bootstrap.Modal(deleteAccountModalEl)
    }

    const downloadDataModalEl = document.getElementById("downloadDataModal")
    if (downloadDataModalEl) {
      new bootstrap.Modal(downloadDataModalEl)
    }

    // Fetch user posts on mount
    fetchUserPosts()
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

  // Update the useEffect to fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchUserPosts(), fetchUserCategories(), fetchUserProfile()])
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [token])

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to remove avatar")
      }

      // Update local state
      setUserProfile((prev) => ({
        ...prev,
        avatar: "",
      }))

      // Clear from session storage
      sessionStorage.removeItem(`userAvatar_${userId}`)

      // Use the context to update avatar
      if (updateAvatar) {
        updateAvatar("")
      }

      // Dispatch event for global avatar update
      window.dispatchEvent(
        new CustomEvent("avatarUpdated", {
          detail: {
            avatar: "",
            userId: userId,
          },
        }),
      )

      toast.success("Avatar removed successfully!")
    } catch (error) {
      console.error("Error removing avatar:", error)
      toast.error("Failed to remove avatar. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Add custom styles for modals */}
      <style>
        {`
          .modal {
            z-index: 1050 !important;
          }
          .modal-backdrop {
            z-index: 1040 !important;
          }
          .modal-dialog {
            margin-top: 10vh;
          }
        `}
      </style>

      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <UserAvatar user={userProfile} size="xl" className="mx-auto mb-3" />
                  <div
                    className="position-absolute bottom-0 end-0 d-flex gap-1"
                    style={{ transform: "translate(25%, 25%)" }}
                  >
                    <button
                      className="btn btn-light btn-sm rounded-circle p-1 shadow-sm"
                      style={{
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fff",
                      }}
                      onClick={() => document.getElementById("avatarInput").click()}
                      disabled={loading}
                      title="Change avatar"
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          style={{ width: "14px", height: "14px" }}
                        ></span>
                      ) : (
                        <i className="bi bi-camera-fill" style={{ fontSize: "14px" }}></i>
                      )}
                    </button>
                    {userProfile.avatar && (
                      <button
                        className="btn btn-light btn-sm rounded-circle p-1 shadow-sm"
                        style={{
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#fff",
                        }}
                        onClick={handleRemoveAvatar}
                        disabled={loading}
                        title="Remove avatar"
                      >
                        <i className="bi bi-x" style={{ fontSize: "16px" }}></i>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    id="avatarInput"
                    className="d-none"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h5 className="mb-2">{userProfile.username}</h5>
                <p className="text-muted small">{userProfile.email}</p>
              </div>
              <h5 className="card-title mb-4">Settings</h5>
              <div className="nav flex-column nav-pills">
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <i className="bi bi-person-fill me-2"></i>
                  Your Information
                </button>
                <button
                  className={`nav-link text-start mb-2 ${activeTab === "security" ? "active" : ""}`}
                  onClick={() => setActiveTab("security")}
                >
                  <i className="bi bi-shield-lock-fill me-2"></i>
                  Security
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
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <div className="row">
                  {/* Left Column - Stats and Categories */}
                  <div className="col-12">
                    {/* Stats Cards */}
                    <div className="row g-3 mb-4">
                      {/* Your Posts Card */}
                      <div className="col-md-6">
                        <div className="card bg-light border-0 rounded-3 h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-file-earmark-text fs-4 text-primary mb-2"></i>
                            <h6 className="card-title">Your Posts</h6>
                            <h2 className="display-5 fw-bold mb-0">{postStats.total}</h2>
                            <div className="d-flex justify-content-center gap-2 mt-2">
                              <span className="badge bg-success">{postStats.approved} Approved</span>
                              <span className="badge bg-warning">{postStats.pending} Pending</span>
                              <span className="badge bg-danger">{postStats.rejected} Rejected</span>
                            </div>
                            <p className="text-muted small mt-2">Total posts created</p>
                          </div>
                        </div>
                      </div>
                      {/* Categories Card */}
                      <div className="col-md-6">
                        <div className="card bg-light border-0 rounded-3 h-100">
                          <div className="card-body text-center">
                            <i className="bi bi-tags fs-4 text-info mb-2"></i>
                            <h6 className="card-title">Categories</h6>
                            <h2 className="display-5 fw-bold mb-0">{userCategories.length}</h2>
                            <p className="text-muted small mt-2">Total categories selected</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Categories Section */}
                    <div className="row">
                      <div className="col-12">
                        <div className="card bg-light border-0 rounded-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="card-title mb-0">Your Categories</h6>
                              {!isEditingCategories ? (
                                <button className="btn btn-outline-secondary btn-sm" onClick={handleEditCategories}>
                                  <i className="bi bi-pencil me-2"></i>
                                  Edit Categories
                                </button>
                              ) : (
                                <div className="d-flex gap-2">
                                  <button className="btn btn-outline-secondary btn-sm" onClick={handleCancelEdit}>
                                    Cancel
                                  </button>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSaveCategories}
                                    disabled={categoryLoading || selectedCategories.length === 0}
                                  >
                                    {categoryLoading ? (
                                      <>
                                        <span
                                          className="spinner-border spinner-border-sm me-2"
                                          role="status"
                                          aria-hidden="true"
                                        ></span>
                                        Saving...
                                      </>
                                    ) : (
                                      "Save Changes"
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditingCategories ? (
                              <div>
                                <p className="text-muted small mb-3">Click on categories to select/deselect them</p>
                                <div className="d-flex flex-wrap gap-2">
                                  {categoryStructure.map((category, index) => (
                                    <React.Fragment key={index}>
                                      <span
                                        className={`badge ${
                                          selectedCategories.includes(category.name) ? "bg-primary" : "bg-secondary"
                                        } cursor-pointer`}
                                        onClick={() => handleCategoryToggle(category.name)}
                                        style={{ cursor: "pointer" }}
                                      >
                                        {category.name}
                                      </span>
                                      {category.similar &&
                                        category.similar.length > 0 &&
                                        category.similar.map((similarCategory, idx) => (
                                          <span
                                            key={`${index}-${idx}`}
                                            className={`badge ${
                                              selectedCategories.includes(similarCategory)
                                                ? "bg-primary"
                                                : "bg-secondary"
                                            } cursor-pointer`}
                                            onClick={() => handleCategoryToggle(similarCategory)}
                                            style={{ cursor: "pointer" }}
                                          >
                                            {similarCategory}
                                          </span>
                                        ))}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex flex-wrap gap-2">
                                {userCategories.length > 0 ? (
                                  userCategories.map((category, index) => (
                                    <span key={index} className="badge bg-primary">
                                      {category}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-muted small">No categories selected yet</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Activity Tab */}
          {activeTab === "activity" && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Your Activity History</h5>
              </div>
              <div className="card-body">{/* <ActivityTimeline limit={20} /> */}</div>
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
                          className={`bi ${
                            passwordErrors.uppercase ? "bi-check-circle-fill" : "bi-x-circle-fill"
                          } me-2`}
                        ></i>
                        At least one uppercase letter (A-Z)
                      </li>
                      <li className={`mb-1 ${passwordErrors.lowercase ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${
                            passwordErrors.lowercase ? "bi-check-circle-fill" : "bi-x-circle-fill"
                          } me-2`}
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
        className="modal"
        id="deleteAccountModal"
        tabIndex="-1"
        aria-labelledby="deleteAccountModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
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
        className="modal"
        id="downloadDataModal"
        tabIndex="-1"
        aria-labelledby="downloadDataModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
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
