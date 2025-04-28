"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

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
  const [activeTab, setActiveTab] = useState("posts")
  const [activeSubTab, setActiveSubTab] = useState("feed") // "feed" or "myPosts"
  const [posts, setPosts] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
            setSelectedCategories(userData.categories || [])

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

    if (activeTab === "profile" && token && userId) {
      fetchUserProfile()
    }

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

    return () => {
      socket.disconnect()
    }
  }, [activeTab, token, userId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const userData = await response.json()
        setUserProfile(userData)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const handlePostClick = (postId) => {
    if (!postId || postId === "undefined") {
      console.error("Invalid postId:", postId)
      return
    }
    navigate(`/post/${postId}`)
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

  const handleLike = async (postId) => {
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

  const handleDislike = async (postId) => {
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

  // Function to render post cards
  const renderPostCards = (postsToRender) => {
    if (loading) {
      return <p>Loading posts...</p>
    }

    if (postsToRender.length === 0) {
      return <p>No posts available.</p>
    }

    return postsToRender.map((post) => (
      <div className="card mb-4 shadow-sm" key={post._id} style={{ cursor: "pointer" }}>
        <div className="card-body" onClick={() => handlePostClick(post._id)}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{post.title}</h5>
            <span className="badge bg-primary">{post.category || "Uncategorized"}</span>
          </div>
          <p className="text-muted small">
            by {post.user?.username || "Unknown User"} • {formatTimeAgo(post.createdAt)}
          </p>
          {post.coverImage && (
            <img
              src={`data:image/jpeg;base64,${post.coverImage}`}
              alt="Post Cover"
              className="img-fluid mb-3"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          )}

          <div className="d-flex justify-content-start align-items-center gap-3 mt-2">
            <button
              className="btn btn-outline-success btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleLike(post._id)
              }}
            >
              👍 {post.likes || 0}
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDislike(post._id)
              }}
            >
              👎 {post.dislikes || 0}
            </button>
            <span className="text-muted ms-2">💬 {post.commentCount || 0} comments</span>
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="d-flex vh-100">
      <div className="p-3 border-end bg-light" style={{ width: "250px" }}>
        <h5 className="fw-bold">Home Page</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
              style={{
                border: "none",
                background: "none",
                padding: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Posts
            </button>

            {activeTab === "posts" && (
              <ul className="nav flex-column ms-3 mt-2">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeSubTab === "feed" ? "active" : ""}`}
                    onClick={() => setActiveSubTab("feed")}
                    style={{
                      border: "none",
                      background: "none",
                      padding: "5px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Feed
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeSubTab === "myPosts" ? "active" : ""}`}
                    onClick={() => setActiveSubTab("myPosts")}
                    style={{
                      border: "none",
                      background: "none",
                      padding: "5px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    My Posts
                  </button>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
              style={{
                border: "none",
                background: "none",
                padding: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Profile
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 p-4">
        {activeTab === "posts" && (
          <>
            <h4>{activeSubTab === "feed" ? "Posts Feed" : "My Posts"}</h4>
            <div style={{ maxWidth: "800px" }}>
              {activeSubTab === "feed" ? renderPostCards(posts) : renderPostCards(myPosts)}
            </div>
          </>
        )}

        {activeTab === "profile" && (
          <>
            <h4>Your Profile</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: "800px" }}>
              {!token ? (
                <div className="alert alert-warning">
                  Please <a href="/login">login</a> to view your profile.
                </div>
              ) : userProfile ? (
                <>
                  <h5>Username: {userProfile.username}</h5>
                  <p>Email: {userProfile.email}</p>
                  <p>Bio: {userProfile.bio || "No bio available"}</p>
                </>
              ) : (
                <p>Loading profile...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HomePage
