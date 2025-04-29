"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { UserProvider } from "./components/UserContext"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import CreatePost from "./pages/CreatePost"
import UserSettings from "./pages/UserSettings"
import ForgotPassword from "./pages/ForgotPassword"
import Header from "./components/Header"
import PostDetails from "./pages/PostDetails"
import EditPost from "./pages/EditPost"
import ProtectedRoute from "./components/ProtectedRoute"
import CategorySetup from "./pages/CategorySetup"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./App.css"
import { useEffect } from "react"
import * as bootstrap from "bootstrap"

function App() {
  // Initialize Bootstrap components when the app loads
  useEffect(() => {
    // Function to initialize Bootstrap components
    const initBootstrap = () => {
      // Initialize all dropdowns with explicit configuration
      document.querySelectorAll(".dropdown-toggle").forEach((dropdownToggle) => {
        // Only create a new instance if one doesn't already exist
        if (!bootstrap.Dropdown.getInstance(dropdownToggle)) {
          new bootstrap.Dropdown(dropdownToggle, {
            autoClose: true,
            boundary: "viewport",
            reference: "toggle",
          })
        }
      })

      // Initialize all modals with proper options
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
    }

    // Initial initialization
    initBootstrap()

    // Re-initialize after route changes
    const handleRouteChange = () => {
      setTimeout(initBootstrap, 100)
    }

    // Add event listener for route changes
    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/user-settings" element={<UserSettings />} />
                <Route path="/post/:postId" element={<PostDetails />} />
                <Route path="/edit-post/:postId" element={<EditPost />} />
              </Route>

              {/* Route for Category Setup */}
              <Route path="/category-setup" element={<CategorySetup />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  )
}

export default App
