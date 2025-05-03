"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import UserAvatar from "./UserAvatar"

const ActivityTimeline = ({ limit = 5 }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const token = sessionStorage.getItem("token")
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    const fetchActivities = async () => {
      if (!token) return

      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/users/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to fetch activity")

        const data = await response.json()
        // Sort by timestamp and limit the number of activities
        const sortedActivities = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit)

        setActivities(sortedActivities)
      } catch (err) {
        console.error("Error fetching activity timeline:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [token, limit, API_BASE_URL])

  // Function to format timestamp
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

  // Function to get icon based on activity type
  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case "post":
        return "bi-file-earmark-text"
      case "comment":
        return "bi-chat-left-text"
      case "reaction":
        return activity.action === "liked" ? "bi-hand-thumbs-up" : "bi-hand-thumbs-down"
      default:
        return "bi-clock-history"
    }
  }

  // Function to get color based on activity type
  const getActivityColor = (activity) => {
    switch (activity.type) {
      case "post":
        return "primary"
      case "comment":
        return "secondary"
      case "reaction":
        return activity.action === "liked" ? "success" : "danger"
      default:
        return "info"
    }
  }

  // Function to get the activity description
  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case "post":
        return `You created a post "${activity.content}"`
      case "comment":
        return `You commented on "${activity.postTitle}"`
      case "reaction":
        return `You ${activity.action} the post "${activity.postTitle}"`
      default:
        return "Unknown activity"
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-3">
        <div className="spinner-border text-primary spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger small py-2">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center text-muted py-3">
        <i className="bi bi-calendar-x me-2"></i>
        No recent activity found
      </div>
    )
  }

  return (
    <div className="activity-timeline">
      {activities.map((activity, index) => (
        <div className="timeline-item" key={index}>
          <div className={`timeline-icon bg-${getActivityColor(activity)}`}>
            <i className={`bi ${getActivityIcon(activity)}`}></i>
          </div>
          <div className="timeline-content">
            <div className="d-flex align-items-center mb-2">
              <UserAvatar
                user={{
                  username: activity.username || "User",
                  avatar: activity.userAvatar,
                }}
                size="sm"
                className="me-2"
              />
              <div>
                <div className="d-flex justify-content-between align-items-top mb-1">
                  <h6 className="mb-0 fs-6">{getActivityDescription(activity)}</h6>
                  <span className="badge bg-light text-dark small">{activity.category}</span>
                </div>
                <div className="text-muted small d-flex align-items-center">
                  <i className="bi bi-clock me-1"></i>
                  {formatTimeAgo(activity.timestamp)}

                  {activity.postId && (
                    <Link to={`/post/${activity.postId}`} className="ms-2 btn btn-sm btn-link p-0 text-decoration-none">
                      <i className="bi bi-arrow-right me-1"></i>
                      View
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityTimeline
