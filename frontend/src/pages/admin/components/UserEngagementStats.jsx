"use client"

import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

const UserEngagementStats = ({ userEngagement }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (!userEngagement) {
    return <div className="alert alert-info">Loading user engagement data...</div>
  }

  const { topContributors, commentStats, reportStats } = userEngagement

  return (
    <div className={`user-engagement-stats ${loaded ? "loaded" : ""}`}>
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Top Contributors</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {topContributors && topContributors.length > 0 ? (
                  topContributors.map((user, index) => (
                    <li
                      key={index}
                      className="list-group-item border-0 d-flex justify-content-between align-items-center px-4 py-3"
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.username}
                              className="rounded-circle"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                              style={{ width: "40px", height: "40px" }}
                            >
                              {user.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <h6 className="mb-0">{user.username || "Unknown User"}</h6>
                          <small className="text-muted">
                            {user.postCount} {user.postCount === 1 ? "post" : "posts"}
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-primary rounded-pill">{index + 1}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item border-0 text-center py-4">
                    <p className="text-muted mb-0">No contributor data available</p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Engagement Overview</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="p-4 border rounded text-center">
                    <div className="dashboard-icon bg-primary-light text-primary mx-auto mb-3">
                      <i className="bi bi-chat-dots"></i>
                    </div>
                    <h3 className="display-6 fw-bold mb-0">{commentStats?.total || 0}</h3>
                    <p className="text-muted mb-0">Total Comments</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="p-4 border rounded text-center">
                    <div className="dashboard-icon bg-success-light text-success mx-auto mb-3">
                      <i className="bi bi-chat-text"></i>
                    </div>
                    <h3 className="display-6 fw-bold mb-0">{commentStats?.lastMonth || 0}</h3>
                    <p className="text-muted mb-0">Comments This Month</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="p-4 border rounded text-center">
                    <div className="dashboard-icon bg-warning-light text-warning mx-auto mb-3">
                      <i className="bi bi-flag"></i>
                    </div>
                    <h3 className="display-6 fw-bold mb-0">{reportStats?.total || 0}</h3>
                    <p className="text-muted mb-0">Total Reports</p>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="p-4 border rounded text-center">
                    <div className="dashboard-icon bg-danger-light text-danger mx-auto mb-3">
                      <i className="bi bi-exclamation-triangle"></i>
                    </div>
                    <h3 className="display-6 fw-bold mb-0">{reportStats?.pending || 0}</h3>
                    <p className="text-muted mb-0">Pending Reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserEngagementStats
