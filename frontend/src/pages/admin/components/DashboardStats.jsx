"use client"

import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"

const DashboardStats = ({ stats }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`dashboard-stats ${loaded ? "loaded" : ""}`}>
      <div className="row">
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="dashboard-icon bg-primary-light text-primary">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <h5 className="card-title mb-0 ms-3">Total Posts</h5>
              </div>
              <h3 className="display-6 fw-bold mb-0">{stats?.postCounts?.total || 0}</h3>
              <div className="mt-3 d-flex align-items-center">
                <span className="badge bg-primary me-2">
                  <i className="bi bi-graph-up"></i>
                </span>
                <small className="text-muted">All posts across different categories and statuses</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="dashboard-icon bg-warning-light text-warning">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <h5 className="card-title mb-0 ms-3">Pending</h5>
              </div>
              <h3 className="display-6 fw-bold mb-0">{stats?.postCounts?.pending || 0}</h3>
              <div className="mt-3 d-flex align-items-center">
                <a href="/admin/posts?status=pending" className="text-decoration-none">
                  <span className="badge bg-warning me-2">
                    <i className="bi bi-arrow-right"></i>
                  </span>
                  <small>View pending posts</small>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="dashboard-icon bg-secondary-light text-secondary">
                  <i className="bi bi-check-circle"></i>
                </div>
                <h5 className="card-title mb-0 ms-3">Approved</h5>
              </div>
              <h3 className="display-6 fw-bold mb-0">{stats?.postCounts?.approved || 0}</h3>
              <div className="mt-3 d-flex align-items-center">
                <a href="/admin/posts?status=approved" className="text-decoration-none">
                  <span className="badge bg-secondary me-2">
                    <i className="bi bi-arrow-right"></i>
                  </span>
                  <small>View approved posts</small>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="dashboard-icon bg-danger-light text-danger">
                  <i className="bi bi-x-circle"></i>
                </div>
                <h5 className="card-title mb-0 ms-3">Rejected</h5>
              </div>
              <h3 className="display-6 fw-bold mb-0">{stats?.postCounts?.rejected || 0}</h3>
              <div className="mt-3 d-flex align-items-center">
                <a href="/admin/posts?status=rejected" className="text-decoration-none">
                  <span className="badge bg-danger me-2">
                    <i className="bi bi-arrow-right"></i>
                  </span>
                  <small>View rejected posts</small>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">User Activity</h5>
            </div>
            <div className="card-body p-0">
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Total Users</h6>
                    <small className="text-muted">Registered users</small>
                  </div>
                  <h3 className="fw-bold mb-0">{stats?.userCounts?.total || 0}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Top Categories</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {stats?.categories?.slice(0, 5).map((category, index) => (
                  <li
                    key={index}
                    className="list-group-item border-0 d-flex justify-content-between align-items-center px-4 py-3"
                  >
                    <div className="d-flex align-items-center">
                      <span className="category-icon me-3">{index + 1}</span>
                      <span>{category._id || "Uncategorized"}</span>
                    </div>
                    <span className="badge bg-secondary rounded-pill">{category.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Reports</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Pending Reports</h6>
                  <span className="badge bg-warning">{stats?.reportCounts?.pending || 0}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${Math.min(100, (stats?.reportCounts?.pending || 0) * 10)}%` }}
                    aria-valuenow={stats?.reportCounts?.pending || 0}
                    aria-valuemin="0"
                    aria-valuemax="10"
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Reviewed Reports</h6>
                  <span className="badge bg-secondary">{stats?.reportCounts?.reviewed || 0}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-secondary"
                    role="progressbar"
                    style={{ width: `${Math.min(100, (stats?.reportCounts?.reviewed || 0) * 5)}%` }}
                    aria-valuenow={stats?.reportCounts?.reviewed || 0}
                    aria-valuemin="0"
                    aria-valuemax="20"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats
