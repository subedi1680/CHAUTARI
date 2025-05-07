"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import "./PostDetails.css"
import UserAvatar from "../components/UserAvatar"
import ReportModal from "../components/ReportModal"
import { API_BASE_URL, SOCKET_URL } from "../config"

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

function PostDetails() {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [replies, setReplies] = useState({})
  const [newComment, setNewComment] = useState("")
  const [commentImage, setCommentImage] = useState(null)
  const [replyInputs, setReplyInputs] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null)
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportContent, setReportContent] = useState({ type: "", id: "" })

  const commentInputRef = useRef(null)
  const navigate = useNavigate()

  const loggedInUserId = sessionStorage.getItem("userId")
  const token = sessionStorage.getItem("token")
  const userId = sessionStorage.getItem("userId")

  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID")
      return
    }

    fetchPost()
    fetchComments()

    const socket = io(SOCKET_URL, { withCredentials: true })

    socket.on("postReaction", (updatedPost) => {
      if (updatedPost._id === postId) {
        setPost(updatedPost)
      }
    })

    socket.on("newComment", (comment) => {
      if (comment.post === postId) {
        setComments((prev) => [comment, ...prev])
      }
    })

    socket.on("deleteComment", (data) => {
      if (data.postId === postId) {
        setComments((prev) => prev.filter((c) => c._id !== data.commentId))
      }
    })

    socket.on("newReply", (reply) => {
      setReplies((prev) => ({
        ...prev,
        [reply.comment]: [reply, ...(prev[reply.comment] || [])],
      }))
    })

    socket.on("deleteReply", ({ replyId, commentId }) => {
      setReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId]?.filter((r) => r._id !== replyId),
      }))
    })

    return () => {
      socket.off("postReaction")
      socket.off("newComment")
      socket.off("deleteComment")
      socket.off("newReply")
      socket.off("deleteReply")
      socket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  useEffect(() => {
    // Listen for avatar updates
    const handleAvatarUpdate = (event) => {
      // If the post is from the current user, update the avatar
      if (post && post.user && post.user._id === userId) {
        setPost((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            avatar: event.detail.avatar,
          },
        }))
      }

      // Update avatars in comments
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.user && comment.user._id === userId) {
            return {
              ...comment,
              user: {
                ...comment.user,
                avatar: event.detail.avatar,
              },
            }
          }
          return comment
        }),
      )

      // Update avatars in replies
      setReplies((prev) => {
        const updatedReplies = {}
        Object.keys(prev).forEach((commentId) => {
          updatedReplies[commentId] = prev[commentId].map((reply) => {
            if (reply.user && reply.user._id === userId) {
              return {
                ...reply,
                user: {
                  ...reply.user,
                  avatar: event.detail.avatar,
                },
              }
            }
            return reply
          })
        })
        return updatedReplies
      })
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate)

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate)
    }
  }, [post, userId])

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`)
      if (!res.ok) throw new Error("Failed to fetch post")
      const data = await res.json()
      setPost(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      const data = await res.json()
      setComments(data)
      data.forEach((comment) => fetchReplies(comment._id))
    } catch (err) {
      console.error("Error fetching comments:", err)
    }
  }

  const fetchReplies = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`)
      if (!res.ok) throw new Error("Failed to fetch replies")
      const data = await res.json()
      setReplies((prev) => ({ ...prev, [commentId]: data }))
    } catch (err) {
      console.error("Error fetching replies:", err)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError("You must be logged in to comment.")
      return
    }
    if (!newComment.trim() && !commentImage) {
      setError("Cannot post empty comment.")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("content", newComment)
      formData.append("postId", postId) // Add this line to explicitly include postId
      if (commentImage) formData.append("image", commentImage)

      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()

        // Check if the error is due to being banned
        if (res.status === 403 && errorData.isBanned) {
          throw new Error(errorData.msg || "You are banned and cannot comment.")
        }

        throw new Error(errorData.msg || "Failed to post comment")
      }

      const createdComment = await res.json()
      setComments((prev) => [createdComment, ...prev])

      // Emit commentCount update
      const socket = io(SOCKET_URL, { withCredentials: true })
      socket.emit("commentCountUpdated", { postId: postId, action: "add" })
      socket.disconnect()

      setNewComment("")
      setCommentImage(null)
      if (commentInputRef.current) commentInputRef.current.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReplyInputChange = (commentId, type, value) => {
    setReplyInputs((prev) => {
      const updatedInputs = { ...prev }
      if (!updatedInputs[commentId]) {
        updatedInputs[commentId] = {}
      }
      updatedInputs[commentId][type] = value
      return updatedInputs
    })
  }

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault()
    if (!token) {
      setError("You must be logged in to reply.")
      return
    }

    const replyText = replyInputs[commentId]?.text || ""
    const replyImage = replyInputs[commentId]?.image || null

    if (!replyText.trim() && !replyImage) {
      setError("Cannot post empty reply.")
      return
    }

    try {
      const formData = new FormData()
      formData.append("content", replyText)
      formData.append("commentId", commentId)
      if (replyImage) formData.append("image", replyImage)

      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.msg || "Failed to post reply")
      }

      const createdReply = await res.json()
      setReplies((prev) => ({
        ...prev,
        [commentId]: [createdReply, ...(prev[commentId] || [])],
      }))

      setReplyInputs((prev) => ({ ...prev, [commentId]: { text: "", image: null } }))
      setActiveReplyId(null)
    } catch (err) {
      setError(err.message)
      console.error("Error posting reply:", err)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!token) return
    if (!window.confirm("Delete this comment?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete comment")

      setComments((prev) => prev.filter((comment) => comment._id !== commentId))

      // Emit commentCount update
      const socket = io(SOCKET_URL, { withCredentials: true })
      socket.emit("commentCountUpdated", { postId: postId, action: "remove" })
      socket.emit("contentDeleted", { type: "comment", commentId })
      socket.disconnect()
    } catch (err) {
      setError(err.message)
      console.error("Error deleting comment:", err)
    }
  }

  const handleDeleteReply = async (replyId, commentId) => {
    if (!token) return
    if (!window.confirm("Delete this reply?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete reply")

      setReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId]?.filter((r) => r._id !== replyId),
      }))

      // Emit an event to update notifications in real-time
      const socket = io(SOCKET_URL, { withCredentials: true })
      socket.emit("contentDeleted", { type: "reply", replyId, commentId })
      socket.disconnect()
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleImageClick = (imageSrc) => {
    setImagePreviewSrc(imageSrc)
    setShowImagePreview(true)
  }

  const closeImagePreview = () => {
    setShowImagePreview(false)
    setImagePreviewSrc(null)
  }

  const updateReactions = (postId, updatedData) => {
    if (postId === post._id) {
      setPost((prevPost) => ({
        ...prevPost,
        likes: updatedData.likes,
        dislikes: updatedData.dislikes,
      }))
    }
  }

  const handleLike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to like post")
      const updatedPost = await res.json()
      updateReactions(postId, updatedPost)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDislike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to dislike post")
      const updatedPost = await res.json()
      updateReactions(postId, updatedPost)
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditPost = () => {
    if (post.user._id !== loggedInUserId) {
      setError("You are not authorized to edit this post.")
      return
    }
    navigate(`/edit-post/${postId}`)
  }

  const handleDeletePost = async () => {
    if (post.user._id !== loggedInUserId) {
      setError("You are not authorized to delete this post.")
      return
    }
    if (!window.confirm("Are you sure you want to delete this post?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete post")

      // Emit an event to update notifications in real-time
      const socket = io(SOCKET_URL, { withCredentials: true })
      socket.emit("contentDeleted", { type: "post", postId })
      socket.disconnect()

      navigate("/home")
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReport = (contentType, contentId) => {
    setReportContent({ type: contentType, id: contentId })
    setShowReportModal(true)
  }

  const handleReportSuccess = () => {
    setShowReportModal(false)
    // Show success message
    const successAlert = document.createElement("div")
    successAlert.className =
      "alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4"
    successAlert.setAttribute("role", "alert")
    successAlert.innerHTML = `
      <i class="bi bi-check-circle-fill me-2"></i>
      Thank you for your report. Our team will review it shortly.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.body.appendChild(successAlert)

    // Remove the alert after 5 seconds
    setTimeout(() => {
      successAlert.remove()
    }, 5000)
  }

  if (error)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/home")}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Home
        </button>
      </div>
    )

  if (!post)
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading post details...</p>
      </div>
    )

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => navigate("/home")}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
                <span className="badge bg-primary rounded-pill px-3 py-2">{post.category || "Uncategorized"}</span>
              </div>

              <h2 className="fw-bold mb-3">{post.title}</h2>

              <div className="d-flex align-items-center mb-4">
                <UserAvatar user={post.user} size="md" className="me-2" />
                <div>
                  <p className="mb-0 fw-medium">{post.user?.username || "Unknown User"}</p>
                  <small className="text-muted">{formatTimeAgo(post.createdAt)}</small>
                  {post.edited && <small className="text-muted ms-2">(edited)</small>}
                </div>
              </div>

              {post.user._id === loggedInUserId && (
                <div className="d-flex gap-2 mb-4">
                  <button className="btn btn-outline-primary btn-sm" onClick={handleEditPost}>
                    <i className="bi bi-pencil me-1"></i>
                    Edit Post
                  </button>
                  <button className="btn btn-outline-danger btn-sm" onClick={handleDeletePost}>
                    <i className="bi bi-trash me-1"></i>
                    Delete Post
                  </button>
                </div>
              )}

              {post.status && post.status !== "approved" && (
                <div className={`alert ${post.status === "pending" ? "alert-warning" : "alert-danger"} mt-3`}>
                  <div className="d-flex align-items-center">
                    <i
                      className={`bi ${post.status === "pending" ? "bi-hourglass-split" : "bi-x-circle"} me-2 fs-4`}
                    ></i>
                    <div>
                      <strong>
                        {post.status === "pending" ? "This post is pending approval" : "This post was rejected"}
                      </strong>
                      {post.status === "pending" ? (
                        <p className="mb-0">Only you can see this post until it's approved by an admin.</p>
                      ) : (
                        <>
                          <p className="mb-0">
                            Reason: {post.rejectionReason || "Content does not meet community guidelines"}
                          </p>
                          <p className="mb-0 mt-1">You can edit and resubmit this post for review.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {post.coverImage && (
                <div className="mb-4">
                  <img
                    src={`data:image/jpeg;base64,${post.coverImage}`}
                    className="img-fluid rounded shadow-sm preview-img"
                    onClick={() => handleImageClick(`data:image/jpeg;base64,${post.coverImage}`)}
                    style={{ cursor: "pointer", maxHeight: "500px", width: "100%", objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="post-content mb-4">
                <p className="fs-5">{post.content}</p>
              </div>

              <div className="d-flex gap-3 mb-2">
                <button
                  className={`btn ${post.likedBy?.includes(loggedInUserId) ? "btn-primary" : "btn-outline-primary"} rounded-pill d-flex align-items-center gap-2`}
                  onClick={handleLike}
                  disabled={!token}
                >
                  <i className="bi bi-hand-thumbs-up"></i>
                  <span>{post.likes || 0}</span>
                </button>
                <button
                  className={`btn ${post.dislikedBy?.includes(loggedInUserId) ? "btn-secondary" : "btn-outline-secondary"} rounded-pill d-flex align-items-center gap-2`}
                  onClick={handleDislike}
                  disabled={!token}
                >
                  <i className="bi bi-hand-thumbs-down"></i>
                  <span>{post.dislikes || 0}</span>
                </button>
                {token && post.user?._id !== loggedInUserId && (
                  <button
                    className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                    onClick={() => handleReport("post", post._id)}
                  >
                    <i className="bi bi-flag"></i>
                    <span>Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-4">
              <h4 className="mb-4 fw-bold">
                <i className="bi bi-chat-left-text me-2"></i>
                Comments ({comments.length})
              </h4>

              {token ? (
                <form onSubmit={handleCommentSubmit} className="mb-4">
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      ref={commentInputRef}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="input-group">
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setCommentImage(e.target.files[0])}
                      />
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Posting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Please{" "}
                  <a href="/login" className="alert-link">
                    login
                  </a>{" "}
                  to comment.
                </div>
              )}

              {comments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-chat-square-text" style={{ fontSize: "3rem", color: "#dee2e6" }}></i>
                  <p className="text-muted mt-3">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div className="d-flex mb-2">
                          <UserAvatar user={comment.user} size="sm" className="me-2" />
                          <div>
                            <h6 className="mb-0">{comment.user?.username || "Unknown User"}</h6>
                            <small className="text-muted">{formatTimeAgo(comment.createdAt)}</small>
                          </div>
                        </div>
                        {comment.user?._id === loggedInUserId && (
                          <button className="btn btn-sm text-danger" onClick={() => handleDeleteComment(comment._id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>

                      <p className="mb-3">{comment.content}</p>

                      {comment.image && (
                        <div className="mb-3">
                          <img
                            src={comment.image || "/placeholder.svg"}
                            alt="Comment"
                            className="img-fluid rounded shadow-sm preview-img"
                            style={{ maxWidth: "100%", maxHeight: "300px", cursor: "pointer" }}
                            onClick={() => handleImageClick(comment.image)}
                          />
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <button
                            className="btn btn-sm btn-link text-decoration-none"
                            onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                          >
                            <i className="bi bi-reply me-1"></i>
                            Reply
                          </button>
                          {token && comment.user?._id !== loggedInUserId && (
                            <button
                              className="btn btn-sm btn-link text-decoration-none text-secondary ms-2"
                              onClick={() => handleReport("comment", comment._id)}
                            >
                              <i className="bi bi-flag me-1"></i>
                              Report
                            </button>
                          )}
                        </div>
                        <small className="text-muted">
                          {replies[comment._id]?.length || 0} {replies[comment._id]?.length === 1 ? "reply" : "replies"}
                        </small>
                      </div>

                      {/* Reply Form */}
                      {activeReplyId === comment._id && token && (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, comment._id)}
                          className="mb-3 ms-4 p-3 bg-light rounded"
                        >
                          <div className="mb-2">
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              placeholder="Write a reply..."
                              value={replyInputs[comment._id]?.text || ""}
                              onChange={(e) => handleReplyInputChange(comment._id, "text", e.target.value)}
                            ></textarea>
                          </div>
                          <div className="d-flex">
                            <input
                              type="file"
                              accept="image/*"
                              className="form-control form-control-sm me-2"
                              onChange={(e) => handleReplyInputChange(comment._id, "image", e.target.files[0])}
                            />
                            <button className="btn btn-sm btn-primary">
                              <i className="bi bi-send me-1"></i>
                              Reply
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Replies */}
                      {replies[comment._id]?.length > 0 && (
                        <div className="ms-4 mt-3">
                          {replies[comment._id].map((reply) => (
                            <div key={reply._id} className="bg-light rounded p-3 mb-2">
                              <div className="d-flex justify-content-between">
                                <div className="d-flex mb-2">
                                  <UserAvatar user={reply.user} size="sm" className="me-2" />
                                  <div>
                                    <h6 className="mb-0 fs-6">{reply.user?.username || "Unknown"}</h6>
                                    <small className="text-muted">{formatTimeAgo(reply.createdAt)}</small>
                                  </div>
                                </div>
                                <div>
                                  {reply.user?._id === loggedInUserId && (
                                    <button
                                      className="btn btn-sm text-danger"
                                      onClick={() => handleDeleteReply(reply._id, comment._id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  )}
                                  {token && reply.user?._id !== loggedInUserId && (
                                    <button
                                      className="btn btn-sm text-secondary ms-1"
                                      onClick={() => handleReport("reply", reply._id)}
                                    >
                                      <i className="bi bi-flag"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="mb-2">{reply.content}</p>
                              {reply.image && (
                                <img
                                  src={reply.image || "/placeholder.svg"}
                                  alt="Reply"
                                  className="img-fluid rounded shadow-sm preview-img"
                                  style={{ maxWidth: "100%", maxHeight: "200px", cursor: "pointer" }}
                                  onClick={() => handleImageClick(reply.image)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Image Preview */}
      {showImagePreview && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={closeImagePreview}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0">
                <button type="button" className="btn-close" aria-label="Close" onClick={closeImagePreview}></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={imagePreviewSrc || "/placeholder.svg"}
                  className="img-fluid zoomable"
                  alt="Preview"
                  style={{ maxHeight: "80vh", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <ReportModal
          contentType={reportContent.type}
          contentId={reportContent.id}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  )
}

export default PostDetails
