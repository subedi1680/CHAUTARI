/* eslint-disable react/prop-types */
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PostApprovalModal from "./PostApprovalModal"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

const PendingPostsList = ({ limit = 10, onStatusChange }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    // Fetch pending posts
    const fetchPendingPosts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/posts?status=pending&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized, redirect to login
            sessionStorage.removeItem("adminToken")
            navigate("/admin/login")
            return
          }
          throw new Error("Failed to fetch pending posts")
        }

        const data = await response.json()
        setPosts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingPosts()
  }, [API_BASE_URL, navigate, limit])

  // Handle post approval
  const handleApprovePost = async (postId) => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to approve post")
      }

      // Update posts list
      setPosts(posts.filter((post) => post._id !== postId))

      // Notify parent component
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Handle post rejection
  const handleRejectPost = async (postId, reason) => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject post")
      }

      // Update posts list
      setPosts(posts.filter((post) => post._id !== postId))

      // Notify parent component
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Open post modal
  const openPostModal = (post) => {
    setSelectedPost(post)
    setShowModal(true)
  }

  // Close post modal
  const closePostModal = () => {
    setShowModal(false)
    setSelectedPost(null)
  }

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>
  }

  if (posts.length === 0) {
    return <div className="text-center p-4">No pending posts found.</div>
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post._id}>
                <td>
                  <div className="d-flex align-items-center">
                    {post.coverImage && (
                      <div className="me-2">
                        <img
                          src={`data:image/jpeg;base64,${post.coverImage}`}
                          alt=""
                          className="rounded"
                          width="40"
                          height="40"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="text-truncate" style={{ maxWidth: "200px" }}>
                      {post.title}
                    </div>
                  </div>
                </td>
                <td>{post.user?.username || "Unknown"}</td>
                <td>
                  <span className="badge bg-primary">{post.category}</span>
                </td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openPostModal(post)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleApprovePost(post._id)}
                      title="Approve"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openPostModal(post)}
                      title="Reject"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Post Approval Modal */}
      <PostApprovalModal
        post={selectedPost}
        show={showModal}
        onClose={closePostModal}
        onApprove={handleApprovePost}
        onReject={handleRejectPost}
      />
    </>
  )
}

export default PendingPostsList
