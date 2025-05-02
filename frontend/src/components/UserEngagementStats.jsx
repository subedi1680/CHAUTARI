"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const UserEngagementStats = ({ userId }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const token = sessionStorage.getItem("token")
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchEngagementStats = async () => {
      if (!token) {
        navigate("/login")
        return
      }

      try {
        setLoading(true)
        // Fetch user activity
        const activityResponse = await fetch(`${API_BASE_URL}/api/users/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!activityResponse.ok) throw new Error("Failed to fetch user activity")
        const activities = await activityResponse.json()

        // Calculate engagement stats
        const postCount = activities.filter((activity) => activity.type === "post").length
        const commentCount = activities.filter((activity) => activity.type === "comment").length
        const reactionCount = activities.filter((activity) => activity.type === "reaction").length

        // Get the top categories from activities
        const categoryCounts = activities.reduce((acc, activity) => {
          if (activity.category) {
            acc[activity.category] = (acc[activity.category] || 0) + 1
          }
          return acc
        }, {})

        const topCategories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, count]) => ({ category, count }))

        // Calculate active days
        const activityDates = activities.map((a) => new Date(a.timestamp).toLocaleDateString())
        const uniqueDays = new Set(activityDates).size

        // Calculate post views (placeholder since the backend doesn't track this yet)
        // This would normally come from the backend
        const postViews = Math.floor(postCount * (Math.random() * 10 + 5)) // Just a simulation

        // Calculate engagement score
        const engagementScore = Math.min(
          100,
          Math.floor((postCount * 5 + commentCount * 3 + reactionCount * 1 + uniqueDays * 2) / 2),
        )

        setStats({
          postCount,
          commentCount,
          reactionCount,
          topCategories,
          activeDays: uniqueDays,
          postViews,
          engagementScore,
          lastActive: activities.length > 0 ? activities[0].timestamp : null,
        })
      } catch (err) {
        console.error("Error fetching user engagement stats:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEngagementStats()
  }, [token, userId, navigate, API_BASE_URL])

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading engagement stats: {error}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="user-engagement-stats">
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Engagement Overview</h5>
          <div className="badge bg-primary rounded-pill px-3 py-2">Engagement Score: {stats.engagementScore}/100</div>
        </div>
        <div className="card-body">
          <div className="row gy-3">
            <div className="col-md-3 col-sm-6">
              <div className="engagement-stat text-center">
                <i className="bi bi-file-earmark-text"></i>
                <div className="engagement-value">{stats.postCount}</div>
                <div className="engagement-label">Posts Created</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="engagement-stat text-center">
                <i className="bi bi-chat-left-text"></i>
                <div className="engagement-value">{stats.commentCount}</div>
                <div className="engagement-label">Comments Made</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="engagement-stat text-center">
                <i className="bi bi-hand-thumbs-up"></i>
                <div className="engagement-value">{stats.reactionCount}</div>
                <div className="engagement-label">Reactions</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="engagement-stat text-center">
                <i className="bi bi-eye"></i>
                <div className="engagement-value">{stats.postViews}</div>
                <div className="engagement-label">Post Views</div>
              </div>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="mt-4">
            <h6 className="mb-3">Activity Breakdown</h6>
            <div className="progress-label">
              <span>Posts</span>
              <span>{stats.postCount}</span>
            </div>
            <div className="progress progress-small mb-3">
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${Math.min(100, stats.postCount * 10)}%` }}
                aria-valuenow={stats.postCount}
                aria-valuemin="0"
                aria-valuemax="10"
              ></div>
            </div>

            <div className="progress-label">
              <span>Comments</span>
              <span>{stats.commentCount}</span>
            </div>
            <div className="progress progress-small mb-3">
              <div
                className="progress-bar bg-secondary"
                role="progressbar"
                style={{ width: `${Math.min(100, stats.commentCount * 5)}%` }}
                aria-valuenow={stats.commentCount}
                aria-valuemin="0"
                aria-valuemax="20"
              ></div>
            </div>

            <div className="progress-label">
              <span>Reactions</span>
              <span>{stats.reactionCount}</span>
            </div>
            <div className="progress progress-small mb-3">
              <div
                className="progress-bar bg-info"
                role="progressbar"
                style={{ width: `${Math.min(100, stats.reactionCount * 3.33)}%` }}
                aria-valuenow={stats.reactionCount}
                aria-valuemin="0"
                aria-valuemax="30"
              ></div>
            </div>
          </div>

          {/* Top Categories */}
          {stats.topCategories.length > 0 && (
            <div className="mt-4">
              <h6 className="mb-3">Top Categories</h6>
              <div className="d-flex flex-wrap gap-2">
                {stats.topCategories.map((cat, index) => (
                  <div key={index} className="badge bg-light text-dark px-3 py-2 rounded-pill">
                    {cat.category} <span className="badge bg-secondary ms-1">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Active */}
          {stats.lastActive && (
            <div className="mt-4 text-muted small">
              <i className="bi bi-clock me-1"></i>
              Last active: {new Date(stats.lastActive).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserEngagementStats
