"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import ReportedContentTable from "./components/ReportedContentTable"
import useAdminSocket from "../../hooks/useAdminSocket"
import "./admin.css"

const AdminReports = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "all",
    contentType: searchParams.get("type") || "all",
    sort: searchParams.get("sort") || "createdAt",
  })

  // Handle new report notification
  const handleNewReport = () => {
    fetchReports()
  }

  // Initialize admin socket
  useAdminSocket(null, null, handleNewReport)

  // Fetch reports with filters
  const fetchReports = async () => {
    setLoading(true)
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) {
        setError("Admin token not found")
        setLoading(false)
        return
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

      // Build query string from filters
      const queryParams = new URLSearchParams()
      if (filters.status !== "all") {
        queryParams.append("status", filters.status)
      }
      if (filters.contentType !== "all") {
        queryParams.append("contentType", filters.contentType)
      }
      queryParams.append("sort", filters.sort)

      const response = await fetch(`${API_BASE_URL}/api/admin/reports?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`)
      }

      const data = await response.json()

      // Log the data structure to help with debugging
      console.log("Reports data:", data)

      setReports(data)
    } catch (err) {
      console.error("Error fetching reports:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))

    // Update URL params
    if (value === "all") {
      searchParams.delete(name)
    } else {
      searchParams.set(name, value)
    }
    setSearchParams(searchParams)
  }

  // Handle report actions (dismiss or delete)
  const handleReportAction = async (reportId, action) => {
    try {
      const adminToken = sessionStorage.getItem("adminToken")
      if (!adminToken) return

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update report: ${response.status}`)
      }

      // Refresh reports list
      fetchReports()
    } catch (err) {
      console.error(`Error ${action} report:`, err)
      setError(`Failed to ${action} report. Please try again.`)
    }
  }

  useEffect(() => {
    fetchReports()
    // Set up refresh interval
    const refreshInterval = setInterval(fetchReports, 60000) // Refresh every minute

    return () => clearInterval(refreshInterval)
  }, [filters])

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="reports" />
      <div className="admin-content flex-grow-1">
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">Content Reports</h1>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchReports}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <h4 className="alert-heading">Error Loading Reports</h4>
              <p>{error}</p>
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="statusFilter" className="form-label">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    name="status"
                    className="form-select"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="contentTypeFilter" className="form-label">
                    Content Type
                  </label>
                  <select
                    id="contentTypeFilter"
                    name="contentType"
                    className="form-select"
                    value={filters.contentType}
                    onChange={handleFilterChange}
                  >
                    <option value="all">All Types</option>
                    <option value="post">Posts</option>
                    <option value="comment">Comments</option>
                    <option value="reply">Replies</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="sortFilter" className="form-label">
                    Sort By
                  </label>
                  <select
                    id="sortFilter"
                    name="sort"
                    className="form-select"
                    value={filters.sort}
                    onChange={handleFilterChange}
                  >
                    <option value="createdAt">Newest First</option>
                    <option value="-createdAt">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <ReportedContentTable reports={reports} loading={loading} onAction={handleReportAction} />
        </div>
      </div>
    </div>
  )
}

export default AdminReports
