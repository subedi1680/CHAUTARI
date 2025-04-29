"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "bootstrap-icons/font/bootstrap-icons.css"

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    day: "",
    month: "",
    year: "",
  })
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Check password strength when password field changes
    if (name === "password") {
      validatePasswordStrength(value)
    }
  }

  const validatePasswordStrength = (password) => {
    setPasswordErrors({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    })
  }

  const isPasswordValid = () => {
    return Object.values(passwordErrors).every(Boolean)
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Check if all date fields are filled
    if (!formData.day || !formData.month || !formData.year) {
      setError("Please select your date of birth.")
      setLoading(false)
      return
    }

    // Format the date of birth to ISO format (YYYY-MM-DD)
    const formattedDOB = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`

    // Password and confirm password check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    // Email validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.")
      setLoading(false)
      return
    }

    // Password strength validation
    if (!isPasswordValid()) {
      setError("Please ensure your password meets all the requirements.")
      setLoading(false)
      return
    }

    // Age check - user must be at least 18 years old
    const birthDate = new Date(formattedDOB)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    const monthDiff = new Date().getMonth() - birthDate.getMonth()
    const isUnder18 = age < 18 || (age === 18 && monthDiff < 0)
    if (isUnder18) {
      setError("You must be at least 18 years old to register.")
      setLoading(false)
      return
    }

    try {
      // Send OTP to the email
      const response = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send OTP")
      }

      setOtpSent(true)
      setSuccessMessage("OTP sent to your email. Please check your inbox.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Verify OTP
      const verifyResponse = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.msg || "Invalid OTP")
      }

      // Format the date of birth to ISO format (YYYY-MM-DD)
      const formattedDOB = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`

      // Register the user
      const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formattedDOB,
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.msg || "Registration failed")
      }

      setSuccessMessage("Registration successful! Redirecting to login...")
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-6 col-md-8 col-sm-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Create Your Account</h2>
                <p className="text-muted">Join CHAUTARI community today</p>
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

              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-person-fill"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="username"
                          name="username"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-envelope-fill"></i>
                        </span>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date of Birth</label>
                    <div className="row g-2">
                      <div className="col-4">
                        <select
                          className="form-select"
                          name="day"
                          value={formData.day}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Day</option>
                          {[...Array(31)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-4">
                        <select
                          className="form-select"
                          name="month"
                          value={formData.month}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Month</option>
                          {[
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                          ].map((month, i) => (
                            <option key={i + 1} value={i + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-4">
                        <select
                          className="form-select"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Year</option>
                          {[...Array(100)].map((_, i) => {
                            const year = new Date().getFullYear() - i
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                    <small className="text-muted">You must be at least 18 years old to register</small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mt-2 small">
                      <p className="mb-1 fw-medium">Password must contain:</p>
                      <ul className="list-unstyled ps-3">
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
                  </div>

                  <div className="mb-4">
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
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
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
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="otp" className="form-label">
                      Enter OTP sent to {formData.email}
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
                  </div>
                  <div className="d-grid mb-3">
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
                        "Verify & Register"
                      )}
                    </button>
                  </div>
                  <div className="text-center">
                    <button type="button" className="btn btn-link" onClick={handleSendOtp} disabled={loading}>
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary fw-bold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
