/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import PostsTable from "./components/PostsTable"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get("status")
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      setStatusFilter(status)
    }
  }, [location.search])

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    // Fetch posts with filters
    fetchPosts()
  }, [API_BASE_URL, navigate, statusFilter, categoryFilter, searchQuery])

  // Fetch posts with filters
  const fetchPosts = async () => {
    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    setLoading(true)
    try {
      let url = `${API_BASE_URL}/api/admin/posts?`

      // Add filters to URL
      if (statusFilter && statusFilter !== "all") {
        url += `status=${statusFilter}&`
      }

      if (categoryFilter) {
        url += `category=${encodeURIComponent(categoryFilter)}&`
      }

      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`
      }

      const response = await fetch(url, {
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
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()
      setPosts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
      setPosts(posts.map((post) => (post._id === postId ? { ...post, status: "approved" } : post)))
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
      setPosts(
        posts.map((post) => (post._id === postId ? { ...post, status: "rejected", rejectionReason: reason } : post)),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    // Search is already triggered by the useEffect dependency
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage={statusFilter === "pending" ? "pending" : "posts"} />

      <div className="admin-content flex-grow-1">
        <div className="container-fluid p-4">
          {error && <div className="alert alert-danger">{error}</div>}

          <h4 className="mb-4">
            {statusFilter === "pending"
              ? "Pending Posts"
              : statusFilter === "approved"
                ? "Approved Posts"
                : statusFilter === "rejected"
                  ? "Rejected Posts"
                  : "All Posts"}
          </h4>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <form onSubmit={handleSearch}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-search"></i>
                      </button>
                    </div>
                  </form>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-end gap-2">
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="Community Discussions">Community Discussions</option>
                      <option value="Technology">Technology</option>
                      <option value="Arts & Culture">Arts & Culture</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Education">Education</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Travel & Places">Travel & Places</option>
                      <option value="Food & Cuisine">Food & Cuisine</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <PostsTable posts={posts} loading={loading} onApprove={handleApprovePost} onReject={handleRejectPost} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPosts
