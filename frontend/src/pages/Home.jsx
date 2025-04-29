/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { categoryStructure } from "../utils/categoryData"
import "./Home.css"

// Add these imports at the top of the file, after the existing imports
import "bootstrap/dist/js/bootstrap.bundle.min.js"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }
  return "just now"
}

function HomePage() {
  const [activeTab, setActiveTab] = useState("feed") // "feed" or "myPosts" or "profile"
  const [posts, setPosts] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingCategories, setEditingCategories] = useState(false)
  const [availableCategories, setAvailableCategories] = useState([])
  const [tempSelectedCategories, setTempSelectedCategories] = useState([])
  const [savingCategories, setSavingCategories] = useState(false)
  const [userActivities, setUserActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const navigate = useNavigate()
  // Add these new state variables in the existing state declarations

  const token = sessionStorage.getItem("token")
  const userId = sessionStorage.getItem("userId")

  useEffect(() => {
    // Fetch user categories on page load
    const fetchData = async () => {
      if (userId && token) {
        try {
          setLoading(true)
          const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const userData = await response.json()
            setUserProfile(userData)
            setSelectedCategories(userData.categories || [])
            setTempSelectedCategories(userData.categories || [])
            sessionStorage.setItem("username", userData.username || "")

            // Now fetch posts after categories are loaded
            const postsResponse = await fetch(`${API_BASE_URL}/api/posts`)
            if (!postsResponse.ok) {
              throw new Error("Failed to fetch posts")
            }
            const postsData = await postsResponse.json()
            if (!Array.isArray(postsData)) {
              throw new Error("Invalid response format from server")
            }

            // Filter posts based on selected categories
            const filteredPosts =
              userData.categories && userData.categories.length > 0
                ? postsData.filter((post) => userData.categories.includes(post.category))
                : postsData

            // Also filter out the user's own posts for the "My Posts" tab
            const userPosts = postsData.filter((post) => post.user?._id === userId)

            const sortedPosts = filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            const sortedMyPosts = userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            setPosts(sortedPosts)
            setMyPosts(sortedMyPosts)
          }
        } catch (err) {
          console.error("Error fetching data:", err)
        } finally {
          setLoading(false)
        }
      } else {
        // If not logged in, just fetch all posts
        fetchAllPosts()
      }
    }

    const fetchAllPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/posts`)
        if (!response.ok) {
          throw new Error("Failed to fetch posts")
        }
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format from server")
        }

        const sortedPosts = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setPosts(sortedPosts)
      } catch (err) {
        console.error("Failed to fetch posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Prepare available categories from categoryStructure
    const allCategories = []
    categoryStructure.forEach((category) => {
      allCategories.push(category.name)
      category.similar.forEach((subCategory) => {
        allCategories.push(subCategory)
      })
    })
    setAvailableCategories(allCategories)

    // Socket listener for real-time updates
    const socket = io(API_BASE_URL, { withCredentials: true })

    socket.on("commentCountUpdated", ({ postId, action }) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            let updatedCount = post.commentCount || 0
            updatedCount = action === "add" ? updatedCount + 1 : Math.max(0, updatedCount - 1)
            return { ...post, commentCount: updatedCount }
          }
          return post
        }),
      )

      setMyPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            let updatedCount = post.commentCount || 0
            updatedCount = action === "add" ? updatedCount + 1 : Math.max(0, updatedCount - 1)
            return { ...post, commentCount: updatedCount }
          }
          return post
        }),
      )
    })

    socket.on("postReaction", ({ postId, likes, dislikes }) => {
      updateReactions(postId, { likes, dislikes })
    })

    return () => {
      socket.disconnect()
    }
  }, [token, userId])

  // Fetch user activities when profile tab is active
  useEffect(() => {
    if (activeTab === "profile" && userId && token) {
      fetchUserActivities()
    }
  }, [activeTab, userId, token])

  const fetchUserActivities = async () => {
    setActivityLoading(true)

    try {
      // Simulate fetching user activities
      // In a real implementation, you would have an API endpoint for this

      // For now, we'll create a mock activity log based on the user's posts
      const activities = []

      // Add post creation activities
      myPosts.forEach((post) => {
        activities.push({
          type: "post",
          action: "created",
          content: post.title,
          target: post._id,
          timestamp: post.createdAt,
          category: post.category,
        })

        // Add like/dislike activities if available
        if (post.likedBy && post.likedBy.includes(userId)) {
          activities.push({
            type: "reaction",
            action: "liked",
            content: post.title,
            target: post._id,
            timestamp: new Date(new Date(post.createdAt).getTime() + 1000 * 60 * 5).toISOString(), // Mock timestamp 5 minutes after post
            category: post.category,
          })
        }
      })

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setUserActivities(activities)
    } catch (err) {
      console.error("Failed to fetch user activities:", err)
    } finally {
      setActivityLoading(false)
    }
  }

  const updateReactions = (postId, updatedData) => {
    // Update reactions in both post lists
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: updatedData.likes,
              dislikes: updatedData.dislikes,
            }
          : post,
      ),
    )

    setMyPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: updatedData.likes,
              dislikes: updatedData.dislikes,
            }
          : post,
      ),
    )
  }

  const handlePostClick = (postId) => {
    if (!postId || postId === "undefined") {
      console.error("Invalid postId:", postId)
      return
    }
    navigate(`/post/${postId}`)
  }

  const handleLike = async (postId, e) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to like post")
      const updatedPost = await res.json()
      updateReactions(postId, updatedPost)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDislike = async (postId, e) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to dislike post")
      const updatedPost = await res.json()
      updateReactions(postId, updatedPost)
    } catch (err) {
      console.error(err)
    }
  }

  // Filter posts based on category
  const getFilteredPosts = () => {
    const postsToFilter = activeTab === "feed" ? posts : myPosts
    if (categoryFilter === "all") return postsToFilter
    return postsToFilter.filter((post) => post.category === categoryFilter)
  }

  // Get unique categories from posts
  const getUniqueCategories = () => {
    const allPosts = [...posts, ...myPosts]
    const categories = allPosts.map((post) => post.category)
    return ["all", ...new Set(categories)].filter(Boolean)
  }

  // Toggle category selection in edit mode
  const toggleCategorySelection = (category) => {
    setTempSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  // Save updated categories
  const saveCategories = async () => {
    if (!userId || !token) return

    setSavingCategories(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: tempSelectedCategories }),
      })

      if (response.ok) {
        setSelectedCategories(tempSelectedCategories)
        setEditingCategories(false)
        // Update user profile with new categories
        setUserProfile((prev) => ({
          ...prev,
          categories: tempSelectedCategories,
        }))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Failed to update categories")
      }
    } catch (err) {
      console.error("Failed to save categories:", err)
      alert("Failed to save your categories. Please try again.")
    } finally {
      setSavingCategories(false)
    }
  }

  // Function to render post cards
  const renderPostCards = () => {
    const filteredPosts = getFilteredPosts()

    if (loading) {
      return (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )
    }

    if (filteredPosts.length === 0) {
      return (
        <div className="text-center my-5 py-5">
          <div className="mb-4">
            <i className="bi bi-journal-text text-secondary" style={{ fontSize: "4rem" }}></i>
          </div>
          <h4 className="text-secondary">No posts available</h4>
          <p className="text-muted">Be the first to create a post in this category!</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate("/create-post")}>
            Create a Post
          </button>
        </div>
      )
    }

    return filteredPosts.map((post) => (
      <div
        className="card mb-4 border-0 shadow-sm rounded-3 overflow-hidden hover-card"
        key={post._id}
        onClick={() => handlePostClick(post._id)}
        style={{ cursor: "pointer" }}
      >
        {post.coverImage && (
          <div className="position-relative overflow-hidden" style={{ height: "200px" }}>
            <img
              src={`data:image/jpeg;base64,${post.coverImage}`}
              alt="Post Cover"
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="badge bg-primary rounded-pill px-3 py-2">{post.category || "Uncategorized"}</span>
            <small className="text-muted">{formatTimeAgo(post.createdAt)}</small>
          </div>
          <h5 className="card-title mb-1">{post.title}</h5>
          <p className="text-muted small mb-3">
            by <span className="fw-bold">{post.user?.username || "Unknown User"}</span>
          </p>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="d-flex gap-3">
              <button
                className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"
                onClick={(e) => handleLike(post._id, e)}
              >
                <i className="bi bi-hand-thumbs-up"></i>
                <span>{post.likes || 0}</span>
              </button>
              <button
                className="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center gap-1"
                onClick={(e) => handleDislike(post._id, e)}
              >
                <i className="bi bi-hand-thumbs-down"></i>
                <span>{post.dislikes || 0}</span>
              </button>
            </div>
            <div className="d-flex align-items-center text-muted">
              <i className="bi bi-chat-left-text me-1"></i>
              <span>{post.commentCount || 0} comments</span>
            </div>
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-lg-3 col-md-4 bg-light border-end sidebar">
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <div
                className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: "50px", height: "50px" }}
              >
                <span className="text-white fw-bold fs-4">{userProfile?.username?.charAt(0).toUpperCase() || "U"}</span>
              </div>
              <div>
                <h5 className="mb-0">{userProfile?.username || "Guest"}</h5>
                <p className="text-muted mb-0 small">{userProfile?.email || ""}</p>
              </div>
            </div>

            <div className="list-group list-group-flush border-0 rounded-3 mb-4">
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeTab === "feed" ? "active" : ""
                }`}
                onClick={() => setActiveTab("feed")}
              >
                <i className="bi bi-grid me-3"></i>
                Feed
              </button>
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeTab === "myPosts" ? "active" : ""
                }`}
                onClick={() => setActiveTab("myPosts")}
              >
                <i className="bi bi-file-earmark-text me-3"></i>
                My Posts
              </button>
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <i className="bi bi-person me-3"></i>
                Profile
              </button>
            </div>

            {(activeTab === "feed" || activeTab === "myPosts") && (
              <div className="mb-4">
                <h6 className="text-uppercase text-muted mb-3 small fw-bold">Categories</h6>
                <div className="list-group list-group-flush border-0 rounded-3">
                  <button
                    className={`list-group-item list-group-item-action ${categoryFilter === "all" ? "active" : ""}`}
                    onClick={() => setCategoryFilter("all")}
                  >
                    All Categories
                  </button>
                  {selectedCategories.map((category, index) => (
                    <button
                      key={index}
                      className={`list-group-item list-group-item-action ${categoryFilter === category ? "active" : ""}`}
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9 col-md-8 main-content">
          <div className="container py-4">
            {(activeTab === "feed" || activeTab === "myPosts") && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">
                    {activeTab === "feed" ? (
                      <span className="d-flex align-items-center">
                        <i className="bi bi-collection me-2"></i>
                        Your Feed
                      </span>
                    ) : (
                      <span className="d-flex align-items-center">
                        <i className="bi bi-journal-text me-2"></i>
                        My Posts
                      </span>
                    )}
                  </h4>
                </div>
                <div className="row">
                  <div className="col-lg-12">{renderPostCards()}</div>
                </div>
              </>
            )}

            {activeTab === "profile" && (
              <>
                <div className="card border-0 shadow-sm rounded-3 mb-4">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-4">
                      <div
                        className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <span className="text-white fw-bold fs-1">
                          {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="ms-3">
                        <h4 className="mb-1">{userProfile?.username || "Loading..."}</h4>
                        <p className="text-muted mb-0">{userProfile?.email || ""}</p>
                      </div>
                      <button className="btn btn-outline-primary ms-auto" onClick={() => navigate("/user-settings")}>
                        <i className="bi bi-pencil me-2"></i>
                        Edit Profile
                      </button>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="card bg-light border-0">
                          <div className="card-body">
                            <h6 className="card-title">Your Posts</h6>
                            <h3 className="card-text">{myPosts.length}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card bg-light border-0">
                          <div className="card-body">
                            <h6 className="card-title">Selected Categories</h6>
                            <h3 className="card-text">{selectedCategories.length}</h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Your Categories</h5>
                        {!editingCategories ? (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingCategories(true)}>
                            <i className="bi bi-pencil me-2"></i>
                            Edit Categories
                          </button>
                        ) : (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setEditingCategories(false)
                                setTempSelectedCategories(selectedCategories)
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={saveCategories}
                              disabled={savingCategories}
                            >
                              {savingCategories ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check2 me-2"></i>
                                  Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {!editingCategories ? (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedCategories.length > 0 ? (
                            selectedCategories.map((category, index) => (
                              <span key={index} className="badge bg-primary rounded-pill px-3 py-2">
                                {category}
                              </span>
                            ))
                          ) : (
                            <p className="text-muted">No categories selected</p>
                          )}
                        </div>
                      ) : (
                        <div className="category-selection p-3 bg-light rounded border">
                          <p className="text-muted small mb-3">Select categories that interest you:</p>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {availableCategories.map((category, index) => (
                              <div
                                key={index}
                                className={`badge rounded-pill px-3 py-2 category-badge ${
                                  tempSelectedCategories.includes(category)
                                    ? "bg-primary"
                                    : "bg-secondary bg-opacity-25 text-dark"
                                }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => toggleCategorySelection(category)}
                              >
                                {tempSelectedCategories.includes(category) && (
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                )}
                                {category}
                              </div>
                            ))}
                          </div>
                          <p className="text-muted small mt-2 mb-0">
                            Selected: {tempSelectedCategories.length} categories
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
