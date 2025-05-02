/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./admin.css"

const AdminSettings = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = sessionStorage.getItem("adminToken")
    const role = sessionStorage.getItem("adminRole")

    if (!adminToken) {
      navigate("/admin/login")
      return
    }

    setIsSuperAdmin(role === "super_admin")

    // Only super admins can fetch all admins
    if (role === "super_admin") {
      fetchAdmins(adminToken)
    } else {
      setLoading(false)
    }
  }, [API_BASE_URL, navigate])

  const fetchAdmins = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Unauthorized or forbidden, redirect to login
          sessionStorage.removeItem("adminToken")
          navigate("/admin/login")
          return
        }
        throw new Error("Failed to fetch admins")
      }

      const data = await response.json()
      setAdmins(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()

    if (!newAdminEmail) {
      setError("Email is required")
      return
    }

    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ email: newAdminEmail, role: newAdminRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to add admin")
      }

      // Refresh admin list
      fetchAdmins(adminToken)

      // Clear form
      setNewAdminEmail("")
      setNewAdminRole("admin")
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) {
      return
    }

    const adminToken = sessionStorage.getItem("adminToken")
    if (!adminToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${adminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to remove admin")
      }

      // Update admin list
      setAdmins(admins.filter((admin) => admin._id !== adminId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar activePage="settings" />

      <div className="admin-content flex-grow-1">
        <div className="container-fluid p-4">
          {error && <div className="alert alert-danger">{error}</div>}

          <h4 className="mb-4">Admin Settings</h4>

          <div className="row">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                  <h5 className="card-title mb-0">Account Information</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={sessionStorage.getItem("adminEmail") || ""}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sessionStorage.getItem("adminRole") || "admin"}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="card-title mb-0">Add New Admin</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAddAdmin}>
                      <div className="mb-3">
                        <label htmlFor="newAdminEmail" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="newAdminEmail"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="newAdminRole" className="form-label">
                          Role
                        </label>
                        <select
                          className="form-select"
                          id="newAdminRole"
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value)}
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-person-plus me-2"></i>
                        Add Admin
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">Manage Admins</h5>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Login</th>
                          <th>Created At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((admin) => (
                          <tr key={admin._id}>
                            <td>{admin.email}</td>
                            <td>
                              <span className={`badge ${admin.role === "super_admin" ? "bg-danger" : "bg-primary"}`}>
                                {admin.role}
                              </span>
                            </td>
                            <td>{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}</td>
                            <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveAdmin(admin._id)}
                                disabled={admin.email === sessionStorage.getItem("adminEmail")}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
