"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { adminApi } from "../../utils/apiService"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

const AdminLogin = () => {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard"

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await adminApi.sendOtp(email)
      setOtpSent(true)
    } catch (err) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await adminApi.verifyOtp(email, otp)

      // Redirect to the original destination or dashboard
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-5 col-md-7 col-sm-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">CHAUTARI Admin</h2>
                <p className="text-muted">
                  {otpSent ? "Enter the OTP sent to your email" : "Enter your admin email to receive an OTP"}
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label">
                      Admin Email
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-envelope-fill"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="Enter your admin email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-4">
                    <label htmlFor="otp" className="form-label">
                      Enter OTP
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-shield-lock-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="otp"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">OTP sent to {email}</small>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={handleSendOtp}
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={loading}>
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Verifying...
                        </>
                      ) : (
                        "Login"
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <a href="/" className="text-primary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Main Site
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
