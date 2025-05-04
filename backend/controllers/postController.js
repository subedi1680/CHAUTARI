/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { io } from "socket.io-client"
import { categoryStructure } from "../utils/categoryData"
import "./Home.css"

// Add these imports at the top of the file, after the existing imports
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import UserAvatar from "../components/UserAvatar"
import UserContext from "../components/UserContext"

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
  const navigate = useNavigate()
  const { userAvatar } = useContext(UserContext)
  const [error, setError] = useState(null)

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const urlSearchQuery = searchParams.get("search") || ""

  const token = sessionStorage.getItem("token")
  const userId = sessionStorage.getItem("userId")

  // Effect to handle search query changes from URL
  useEffect(() => {
    if (urlSearchQuery) {
      // If there's a search query in the URL, fetch all posts and filter them
      fetchAllPostsForSearch(urlSearchQuery)
    }
  }, [urlSearchQuery])

  // Fetch all posts for search
  const fetchAllPostsForSearch = async (query) => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}\`,  {
        headers: {
          Authorization: \`Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data)

        // Also filter my posts if we're in that tab
        const myFilteredPosts = data.filter((post) => post.user?._id === userId)
        setMyPosts(myFilteredPosts)
      } else {
        console.error("Search failed:", response.statusText)
      }
    } catch (error) {
      console.error("Error searching posts:", error)
      setError("Failed to search posts. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
            if (!urlSearchQuery) {
              fetchPosts()
            }

            const postsResponse = await fetch(`${API_BASE_URL}/api/posts`)
            if (!postsResponse.ok) {
              throw new Error("Failed to fetch posts")
            }
            const postsData = await response.json()
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

    if (!urlSearchQuery) {
      fetchData()
    }

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

  // Add useEffect to listen for avatar updates
  useEffect(() => {
    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      // Update avatar in posts
      setPosts((prev) =>
        prev.map((post) => {
          if (post.user && post.user._id === userId) {
            return {
              ...post,
              user: {
                ...post.user,
                avatar: event.detail.avatar,
              },
            }
          }
          return post
        }),
      )

      // Update avatar in myPosts
      setMyPosts((prev) =>
        prev.map((post) => {
          if (post.user && post.user._id === userId) {
            return {
              ...post,
              user: {
                ...post.user,
                avatar: event.detail.avatar,
              },
            }
          }
          return post
        }),
      )

      // Update userProfile avatar
      setUserProfile((prev) => {
        if (prev) {
          return {
            ...prev,
            avatar: event.detail.avatar,
          }
        }
        return prev
      })
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate)

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate)
    }
  }, [userId])

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

  // Filter posts based on category and search query
  const getFilteredPosts = () => {
    const postsToFilter = activeTab === "feed" ? posts : myPosts

    // First filter by category
    const filteredByCategory =
      categoryFilter === "all" ? postsToFilter : postsToFilter.filter((post) => post.category === categoryFilter)

    // Then filter by search query if it exists
    if (urlSearchQuery.trim()) {
      const query = urlSearchQuery.toLowerCase().trim()
      return filteredByCategory.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.category?.toLowerCase().includes(query) ||
          post.user?.username?.toLowerCase().includes(query),
      )
    }

    return filteredByCategory
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
          {urlSearchQuery ? (
            <>
              <p className="text-muted">No posts match your search criteria.</p>
              <button className="btn btn-secondary mt-2" onClick={() => navigate("/home")}>
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p className="text-muted">Be the first to create a post in this category!</p>
              <button className="btn btn-secondary mt-2" onClick={() => navigate("/create-post")}>
                Create a Post
              </button>
            </>
          )}
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
            {post.status === "pending" && (
              <span className="badge bg-warning rounded-pill px-3 py-2">
                <i className="bi bi-hourglass-split me-1"></i>
                Pending Review
              </span>
            )}
            {post.status === "rejected" && (
              <span className="badge bg-danger rounded-pill px-3 py-2">
                <i className="bi bi-x-circle me-1"></i>
                Rejected
              </span>
            )}
          </div>
          <h5 className="card-title mb-1">{post.title}</h5>

          <div className="d-flex align-items-center mb-4">
            <UserAvatar user={post.user} size="sm" className="me-2" />
            <div>
              <p className="mb-0 fw-medium">{post.user?.username || "Unknown User"}</p>
              <small className="text-muted">{formatTimeAgo(post.createdAt)}</small>
              {post.edited && <small className="text-muted ms-2">(edited)</small>}
            </div>
          </div>

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
                className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1"
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

  // Update the fetchPosts function to handle post status
  const fetchPosts = async () => {
    setLoading(true)
    try {
      // Fetch all posts for the user's feed
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()

      // For the main feed, only show approved posts
      const approvedPosts = data.filter((post) => post.status === "approved")
      setPosts(approvedPosts)

      // Fetch user's own posts (including pending and rejected)
      const userPostsResponse = await fetch(`${API_BASE_URL}/api/posts/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!userPostsResponse.ok) {
        throw new Error("Failed to fetch user posts")
      }

      const userPostsData = await userPostsResponse.json()
      setMyPosts(userPostsData)
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to load posts. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-lg-2 col-md-3 bg-light border-end sidebar">
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <UserAvatar
                user={{
                  username: userProfile?.username || "Guest",
                  avatar: userAvatar || userProfile?.avatar,
                }}
                size="md"
                className="me-3"
              />
              <div>
                <h5 className="mb-0">{userProfile?.username || "Guest"}</h5>
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
            </div>
          </div>
        </div>

        {/* Main Content - Posts */}
        <div className="col-lg-7 col-md-6 main-content">
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
                  {urlSearchQuery && (
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary me-2">
                        <i className="bi bi-search me-1"></i>
                        Search: {urlSearchQuery}
                      </span>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/home")}>
                        <i className="bi bi-x"></i> Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-lg-12">{renderPostCards()}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Categories */}
        <div className="col-lg-3 col-md-3 bg-light border-start">
          <div className="p-4">
            <h5 className="text-uppercase text-muted mb-3 fw-bold">Categories</h5>
            <div className="d-flex flex-column gap-2">
              <button
                className={`btn ${
                  categoryFilter === "all" ? "btn-primary" : "btn-outline-secondary"
                } rounded-pill px-3 py-2 mb-2 w-100 text-start`}
                onClick={() => setCategoryFilter("all")}
              >
                All Categories
              </button>
              {selectedCategories.map((category, index) => (
                <button
                  key={index}
                  className={`btn ${
                    categoryFilter === category ? "btn-primary" : "btn-outline-secondary"
                  } rounded-pill px-3 py-2 mb-2 w-100 text-start`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Edit Categories Button */}
            {userId && token && (
              <div className="mt-4">
                <button className="btn btn-outline-primary w-100" onClick={() => navigate("/user-settings")}>
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Categories
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
