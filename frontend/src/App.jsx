"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { UserProvider } from "./components/UserContext"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminProtectedRoute from "./components/AdminProtectedRoute"
import Header from "./components/Header"

// Public pages
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import LandingPage from "./pages/LandingPage"
import PostDetails from "./pages/PostDetails"

// Protected user pages
import CreatePost from "./pages/CreatePost"
import EditPost from "./pages/EditPost"
import UserSettings from "./pages/UserSettings"
import CategorySetup from "./pages/CategorySetup"

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminPosts from "./pages/admin/AdminPosts"
import AdminPostDetail from "./pages/admin/AdminPostDetail"
import AdminReports from "./pages/admin/AdminReports"
import AdminSettings from "./pages/admin/AdminSettings"

// Styles
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./App.css"

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/post/:postId" element={<PostDetails />} />

              {/* Protected user routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/edit-post/:postId" element={<EditPost />} />
                <Route path="/user-settings" element={<UserSettings />} />
                <Route path="/category-setup" element={<CategorySetup />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected admin routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/posts" element={<AdminPosts />} />
                <Route path="/admin/posts/:postId" element={<AdminPostDetail />} />
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>

              {/* Super admin only routes */}
              <Route element={<AdminProtectedRoute superAdminOnly={true} />}>
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  )
}

export default App
