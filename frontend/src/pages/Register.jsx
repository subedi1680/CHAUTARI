"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light" style={{ paddingTop: "100px" }}>
      <div className="container text-center">
        <h1 className="mb-4">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", margin: "auto" }}>
          <h2 className="mb-3">Register</h2>
          {error && <p className="text-danger">{error}</p>}
          {successMessage && <p className="text-success">{successMessage}</p>}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="mb-3 text-start">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3 text-start">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3 text-start">
                <label className="form-label">Date of Birth</label>
                <div className="d-flex gap-2">
                  <select className="form-select" name="day" value={formData.day} onChange={handleChange} required>
                    <option value="">Day</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  <select className="form-select" name="month" value={formData.month} onChange={handleChange} required>
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

                  <select className="form-select" name="year" value={formData.year} onChange={handleChange} required>
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

              <div className="mb-3 text-start">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div className="mt-2 small">
                  <p className="mb-1">Password must contain:</p>
                  <ul className="ps-3">
                    <li className={passwordErrors.length ? "text-success" : "text-danger"}>At least 8 characters</li>
                    <li className={passwordErrors.uppercase ? "text-success" : "text-danger"}>
                      At least one uppercase letter (A-Z)
                    </li>
                    <li className={passwordErrors.lowercase ? "text-success" : "text-danger"}>
                      At least one lowercase letter (a-z)
                    </li>
                    <li className={passwordErrors.number ? "text-success" : "text-danger"}>
                      At least one number (0-9)
                    </li>
                    <li className={passwordErrors.special ? "text-success" : "text-danger"}>
                      At least one special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-3 text-start">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-dark" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label">Enter OTP sent to {formData.email}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-dark" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Register"}
                </button>
              </div>
              <div className="mt-3">
                <button type="button" className="btn btn-link" onClick={handleSendOtp} disabled={loading}>
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-3">
            <a href="/login" className="text-decoration-none">
              Already have an account? Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
