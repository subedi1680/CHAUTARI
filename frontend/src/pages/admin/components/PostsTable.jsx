"use client"

/* eslint-disable react/prop-types */
import { useState } from "react"
import { Link } from "react-router-dom"
import UserAvatar from "../../../components/UserAvatar"

const PostsTable = ({ posts, onApprove, onReject, loading }) => {
  const [expandedRows, setExpandedRows] = useState({})

  const toggleRowExpansion = (postId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    try {
      const options = {
        year: "numeric",
        month: "short",
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

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "No content"
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Safely extract text content from HTML
  const getTextFromHtml = (html) => {
    if (!html) return ""
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="badge bg-success">Approved</span>
      case "rejected":
        return <span className="badge bg-danger">Rejected</span>
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      default:
        return <span className="badge bg-secondary">Unknown</span>
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading posts...</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No posts found matching the current filters.
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: "30%" }}>TITLE</th>
            <th style={{ width: "15%" }}>AUTHOR</th>
            <th style={{ width: "15%" }}>CATEGORY</th>
            <th style={{ width: "15%" }}>DATE</th>
            <th style={{ width: "10%" }}>STATUS</th>
            <th style={{ width: "15%" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post._id}>
              <td>
                <div className="d-flex align-items-center">
                  <div>
                    <div className="fw-medium">{post.title || "Untitled"}</div>
                    <div
                      className="small text-muted text-truncate"
                      style={{ maxWidth: "300px", cursor: "pointer" }}
                      onClick={() => toggleRowExpansion(post._id)}
                    >
                      {truncateText(getTextFromHtml(post.content), 60)}
                    </div>
                    {expandedRows[post._id] && (
                      <div className="mt-2 p-2 bg-light rounded small">
                        {truncateText(getTextFromHtml(post.content), 200)}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="d-flex align-items-center">
                  <UserAvatar user={post.user} size="sm" />
                  <span className="ms-2">{post.user?.username || "Unknown"}</span>
                </div>
              </td>
              <td>
                <span className="badge bg-primary">{post.category || "Uncategorized"}</span>
              </td>
              <td>{formatDate(post.createdAt)}</td>
              <td>{getStatusBadge(post.status)}</td>
              <td>
                <div className="d-flex gap-2">
                  <Link to={`/admin/posts/${post._id}`} className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-eye"></i> View
                  </Link>

                  {/* Approve/Reject buttons removed as requested */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PostsTable
