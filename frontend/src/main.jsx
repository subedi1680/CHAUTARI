import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import * as bootstrap from "bootstrap"
import "./index.css" // Import the CSS file with modal fixes

// Initialize Bootstrap components after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipTriggerList.forEach((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

  // Initialize all dropdowns with explicit configuration
  const dropdownElementList = document.querySelectorAll(".dropdown-toggle")
  dropdownElementList.forEach((dropdownToggle) => {
    // Only create a new instance if one doesn't already exist
    if (!bootstrap.Dropdown.getInstance(dropdownToggle)) {
      new bootstrap.Dropdown(dropdownToggle, {
        autoClose: true,
        boundary: "viewport",
        reference: "toggle",
      })
    }
  })

  // Initialize modals with proper options
  document.querySelectorAll(".modal").forEach((modalElement) => {
    const modalOptions = {
      backdrop: true,
      keyboard: true,
      focus: true,
    }
    // Only create a new modal instance if one doesn't already exist
    if (!bootstrap.Modal.getInstance(modalElement)) {
      new bootstrap.Modal(modalElement, modalOptions)
    }
  })
})

// Request notification permission
if ("Notification" in window) {
  Notification.requestPermission()
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
