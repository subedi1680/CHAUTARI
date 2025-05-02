/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"
import PostApprovalModal from "./PostApprovalModal"

const PostsTable = ({ posts, loading, onApprove, onReject }) => {
  const [selectedPost, setSelectedPost] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const openApprovalModal = (post) => {
    setSelectedPost(post)
    setShowApprovalModal(true)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      case "approved":
        return <span className="badge bg-success">Approved</span>
      case "rejected":
        return <span className="badge bg-danger">Rejected</span>
      default:
        return <span className="badge bg-secondary">Unknown</span>
    }
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

  if (posts.length === 0) {
    return (
      <div className="text-center p-4">
        <i className="bi bi-inbox text-muted" style={{ fontSize: "2rem" }}></i>
        <p className="mt-2 mb-0">No posts found</p>
      </div>
    )
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
              <th>Status</th>
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
                      <div className="me-2" style={{ width: "40px", height: "40px" }}>
                        <img
                          src={`data:image/jpeg;base64,${post.coverImage}`}
                          alt="Cover"
                          className="img-fluid rounded"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="text-truncate" style={{ maxWidth: "200px" }}>
                      {post.title}
                    </div>
                  </div>
                </td>
                <td>{post.user?.username || "Unknown"}</td>
                <td>{post.category}</td>
                <td>{getStatusBadge(post.status)}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openApprovalModal(post)}>
                      <i className="bi bi-eye me-1"></i>
                      View
                    </button>
                    {post.status === "pending" && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => onApprove(post._id)}>
                          <i className="bi bi-check-circle me-1"></i>
                          Approve
                        </button>
                      </>
                    )}
                    {post.status === "approved" && (
                      <button className="btn btn-sm btn-warning" onClick={() => openApprovalModal(post)}>
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPost && (
        <PostApprovalModal
          post={selectedPost}
          show={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onApprove={() => {
            onApprove(selectedPost._id)
            setShowApprovalModal(false)
          }}
          onReject={onReject}
        />
      )}
    </>
  )
}

export default PostsTable
