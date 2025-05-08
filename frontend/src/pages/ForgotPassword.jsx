"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  // Validate password strength
  const validatePasswordStrength = (password) => {
    setPasswordErrors({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    })
  }

  // Check if all password requirements are met
  const isPasswordValid = () => {
    return Object.values(passwordErrors).every(Boolean)
  }

  // Handle email submission and OTP request
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email) {
      setError("Please enter your email address")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send OTP")
      }

      setSuccessMessage("OTP sent to your email. Please check your inbox.")
      setStep(2) // Move to OTP verification step
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!otp) {
      setError("Please enter the OTP")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Invalid OTP")
      }

      setSuccessMessage("OTP verified successfully. Please set your new password.")
      setStep(3) // Move to password reset step
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password")
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!isPasswordValid()) {
      setError("Please ensure your password meets all the requirements")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to reset password")
      }

      setSuccessMessage("Password reset successful! Redirecting to login...")
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle password input change with validation
  const handlePasswordChange = (e) => {
    const password = e.target.value
    setNewPassword(password)
    validatePasswordStrength(password)
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-5 col-md-7 col-sm-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Forgot Password</h2>
                <p className="text-muted">
                  {step === 1 && "Enter your email to reset your password"}
                  {step === 2 && "Enter the OTP sent to your email"}
                  {step === 3 && "Create a new password"}
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMessage}
                </div>
              )}

              {/* Step 1: Email Input */}
              {step === 1 && (
                <form onSubmit={handleSendOtp}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-envelope-fill"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="Enter your registered email"
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
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
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
                        "Verify OTP"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        placeholder="Create a new password"
                        value={newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="mb-2 small fw-medium">Password requirements:</p>
                    <ul className="list-unstyled ps-3 small">
                      <li className={`mb-1 ${passwordErrors.length ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.length ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least 8 characters
                      </li>
                      <li className={`mb-1 ${passwordErrors.uppercase ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.uppercase ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one uppercase letter (A-Z)
                      </li>
                      <li className={`mb-1 ${passwordErrors.lowercase ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.lowercase ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one lowercase letter (a-z)
                      </li>
                      <li className={`mb-1 ${passwordErrors.number ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.number ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one number (0-9)
                      </li>
                      <li className={`${passwordErrors.special ? "text-success" : "text-danger"}`}>
                        <i
                          className={`bi ${passwordErrors.special ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-2`}
                        ></i>
                        At least one special character (@$!%*?&)
                      </li>
                    </ul>
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg rounded-pill"
                      disabled={loading || !isPasswordValid() || newPassword !== confirmPassword}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Resetting Password...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <Link to="/login" className="text-primary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
