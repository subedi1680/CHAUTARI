/* eslint-disable react/prop-types */
"use client"

import { useState } from "react"

const ReportModal = ({ contentType, contentId, onClose, onSuccess }) => {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!reason.trim()) {
      setError("Please provide a reason for reporting this content")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        setError("You must be logged in to report content")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to submit report")
      }

      // Report submitted successfully
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light">
            <h5 className="modal-title">
              <i className="bi bi-flag me-2 text-danger"></i>
              Report {contentType === "post" ? "Post" : contentType === "comment" ? "Comment" : "Reply"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="reportReason" className="form-label fw-medium">
                  Why are you reporting this content?
                </label>
                <textarea
                  id="reportReason"
                  className="form-control"
                  rows="4"
                  placeholder="Please provide details about why this content should be reviewed by moderators..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                ></textarea>
                <div className="form-text text-muted">Your report will be anonymous to other users.</div>
              </div>
              <div className="alert alert-info d-flex align-items-center">
                <i className="bi bi-info-circle-fill me-2"></i>
                <div>
                  <strong>Note:</strong> Your report will be reviewed by our moderation team. Thank you for helping keep
                  our community safe.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-flag me-2"></i>
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReportModal
