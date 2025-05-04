/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import UserAvatar from "../../components/UserAvatar"
import DOMPurify from "dompurify"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminPostDetail = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null) // Added to track specific error types
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    // Fetch post details
    const fetchPostDetails = async () => {
      setLoading(true)
      setError(null)
      setErrorType(null)

      try {
        // First try to fetch from admin endpoint
        let response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        // If admin endpoint fails, try the regular post endpoint
        if (!response.ok && response.status !== 401) {
          console.log("Admin endpoint failed, trying regular post endpoint")
          response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          })
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized, redirect to login
            sessionStorage.removeItem("adminToken")
            sessionStorage.removeItem("adminEmail")
            sessionStorage.removeItem("adminRole")
            navigate("/admin/login")
            return
          } else if (response.status === 404) {
            setErrorType("not_found")
            throw new Error("Post not found")
          } else {
            setErrorType("fetch_error")
            throw new Error("Failed to fetch post details")
          }
        }

        const data = await response.json()

        // Check if the data has the expected structure
        if (!data || !data._id) {
          setErrorType("invalid_data")
          throw new Error("Invalid post data received")
        }

        setPost(data)
      } catch (err) {
        console.error("Error fetching post:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPostDetails()
    } else {
      setError("No post ID provided")
      setErrorType("no_id")
      setLoading(false)
    }
  }, [postId, API_BASE_URL, navigate])

  // Handle post approval
  const handleApprove = async () => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken || !post) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${post._id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("adminToken")
          sessionStorage.removeItem("adminEmail")
          sessionStorage.removeItem("adminRole")
          navigate("/admin/login")
          return
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.msg || "Failed to approve post")
      }

      // Get the updated post data
      const updatedPost = await response.json()
      setPost(updatedPost || { ...post, status: "approved" })
    } catch (err) {
      console.error("Error approving post:", err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle post rejection
  const handleReject = async (e) => {
    e.preventDefault()
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken || !post) return

    setIsSubmitting(true)
    setError(null)

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/posts/${post._id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("adminToken")
          sessionStorage.removeItem("adminEmail")
          sessionStorage.removeItem("adminRole")
          navigate("/admin/login")
          return
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.msg || "Failed to reject post")
      }

      // Get the updated post data
      const updatedPost = await response.json()
      setPost(updatedPost || { ...post, status: "rejected", rejectionReason })
      setShowRejectForm(false)
      setRejectionReason("")
    } catch (err) {
      console.error("Error rejecting post:", err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    try {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
      return new Date(dateString).toLocaleDateString(undefined, options)
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Invalid date"
    }
  }

  // Safely render HTML content with sanitization
  const renderContent = (content) => {
    if (!content) return <p className="text-muted">No content available</p>
    return <div className="post-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
  }

  // Render different error states
  const renderErrorState = () => {
    switch (errorType) {
      case "not_found":
        return (
          <div className="alert alert-warning">
            <h5>
              <i className="bi bi-exclamation-triangle me-2"></i>Post Not Found
            </h5>
            <p>The post you're looking for could not be found. It may have been deleted or never existed.</p>
            <Link to="/admin/posts" className="btn btn-primary mt-2">
              <i className="bi bi-arrow-left me-2"></i>Back to Posts List
            </Link>
          </div>
        )
      case "fetch_error":
        return (
          <div className="alert alert-danger">
            <h5>
              <i className="bi bi-x-circle me-2"></i>Error Loading Post
            </h5>
            <p>There was a problem loading the post details. This could be due to a network issue or server problem.</p>
            <div className="mt-3">
              <button className="btn btn-outline-primary me-2" onClick={() => window.location.reload()}>
                <i className="bi bi-arrow-clockwise me-2"></i>Try Again
              </button>
              <Link to="/admin/posts" className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>Back to Posts List
              </Link>
            </div>
          </div>
        )
      case "invalid_data":
        return (
          <div className="alert alert-danger">
            <h5>
              <i className="bi bi-database-x me-2"></i>Invalid Data Received
            </h5>
            <p>The server returned data in an unexpected format. This could be due to a server issue or API change.</p>
            <div className="mt-3">
              <Link to="/admin/posts" className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>Back to Posts List
              </Link>
            </div>
          </div>
        )
      case "no_id":
        return (
          <div className="alert alert-warning">
            <h5>
              <i className="bi bi-question-circle me-2"></i>No Post Selected
            </h5>
            <p>No post ID was provided. Please select a post from the posts list.</p>
            <Link to="/admin/posts" className="btn btn-primary mt-2">
              <i className="bi bi-list me-2"></i>View Posts List
            </Link>
          </div>
        )
      default:
        return (
          <div className="alert alert-danger">
            <h5>
              <i className="bi bi-exclamation-circle me-2"></i>Error
            </h5>
            <p>{error || "An unknown error occurred"}</p>
            <div className="mt-3">
              <button className="btn btn-outline-primary me-2" onClick={() => window.location.reload()}>
                <i className="bi bi-arrow-clockwise me-2"></i>Try Again
              </button>
              <Link to="/admin/posts" className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>Back to Posts List
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="posts" />

      <div className="admin-content flex-grow-1">
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Post Details</h4>
            <Link to="/admin/posts" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Posts
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading post details...</p>
            </div>
          ) : error ? (
            renderErrorState()
          ) : post ? (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    {post.title || "Untitled Post"}
                    {post.status === "pending" && <span className="badge bg-warning ms-2">Pending</span>}
                    {post.status === "approved" && <span className="badge bg-success ms-2">Approved</span>}
                    {post.status === "rejected" && <span className="badge bg-danger ms-2">Rejected</span>}
                  </h5>
                </div>
                <div>
                  {post.status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setShowRejectForm(true)}
                        disabled={showRejectForm || isSubmitting}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Reject
                      </button>
                    </>
                  )}

                  {post.status === "approved" && (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => setShowRejectForm(true)}
                      disabled={showRejectForm || isSubmitting}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Change to Rejected
                    </button>
                  )}

                  {post.status === "rejected" && (
                    <button type="button" className="btn btn-success" onClick={handleApprove} disabled={isSubmitting}>
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Change to Approved
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body p-4">
                {/* Post Header */}
                <div className="post-header mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      {post.user && <UserAvatar user={post.user} size="md" />}
                      <div className="ms-2">
                        <div className="fw-bold">{post.user?.username || "Unknown User"}</div>
                        <div className="text-muted small">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span className="badge bg-primary">{post.category || "Uncategorized"}</span>
                  </div>

                  {post.coverImage && (
                    <div className="post-cover-image mb-3">
                      <img
                        src={`data:image/jpeg;base64,${post.coverImage}`}
                        alt="Cover"
                        className="img-fluid rounded"
                        style={{ maxHeight: "300px", width: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          console.error("Image loading error")
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23cccccc' fill='none'/%3E%3Cpath d='M40,50 L60,50 M50,40 L50,60' stroke='%23cccccc' strokeWidth='2'/%3E%3C/svg%3E"
                          e.target.alt = "Image not available"
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="post-content-container p-3 bg-light rounded mb-4">
                  <h6 className="fw-bold mb-3">Content</h6>
                  <div className="post-content-scroll" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {renderContent(post.content)}
                  </div>
                </div>

                {/* Rejection Form */}
                {showRejectForm && (
                  <div className="card mb-4 border-danger">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">Reject Post</h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleReject}>
                        <div className="mb-3">
                          <label htmlFor="rejectionReason" className="form-label">
                            Reason for Rejection
                          </label>
                          <textarea
                            id="rejectionReason"
                            className="form-control"
                            rows="3"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide a reason for rejecting this post..."
                            required
                          ></textarea>
                        </div>
                        <div className="d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={() => setShowRejectForm(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Submitting...
                              </>
                            ) : (
                              "Confirm Rejection"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {post.status === "rejected" && post.rejectionReason && (
                  <div className="alert alert-danger">
                    <h6 className="alert-heading">
                      <i className="bi bi-x-circle me-2"></i>
                      Rejection Reason
                    </h6>
                    <p className="mb-0">{post.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No post data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPostDetail
