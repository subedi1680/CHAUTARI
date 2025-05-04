"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Select from "react-select"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function CreateNewPost() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newImage, setNewImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [userCategories, setUserCategories] = useState([])
  const navigate = useNavigate()

  // Fetch user categories when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        console.log("Fetching user categories with token:", token)
        console.log("API URL:", `${API_BASE_URL}/api/users/profile`)

        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log("Response status:", response.status)

        if (response.ok) {
          const userData = await response.json()
          console.log("User data received:", userData)
          console.log("User categories:", userData.categories)

          // Transform categories into react-select format
          const formattedCategories = (userData.categories || []).map((category) => ({
            value: category,
            label: category,
          }))

          setUserCategories(formattedCategories)
        } else {
          console.error("Failed to fetch user data:", response.statusText)
        }
      } catch (err) {
        console.error("Error fetching user categories:", err)
      }
    }

    fetchUserData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, coverImage: e.target.files[0] }))
  }

  const handleCategoryChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, category: selectedOption.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.title || !formData.category || !formData.content) {
      setError("Title, category, and content are required")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("title", formData.title)
    formDataToSend.append("category", formData.category)
    formDataToSend.append("content", formData.content)
    if (formData.coverImage) {
      formDataToSend.append("coverImage", formData.coverImage)
    }

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please log in first.")
        return
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Check if the error is due to being banned
        if (response.status === 403 && errorData.isBanned) {
          setError(errorData.msg || "You are banned and cannot create posts.")
          return
        }

        throw new Error(errorData.msg || "Failed to create post. Make sure you are logged in.")
      }

      navigate("/home")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-7 col-md-9 col-sm-11">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Create New Post</h2>
                <p className="text-muted">Share your thoughts with the CHAUTARI community</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Title
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-type-h1"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      placeholder="Enter a descriptive title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    Category
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-tag"></i>
                    </span>
                    <div className="form-control p-0" style={{ overflow: "visible" }}>
                      <Select
                        options={userCategories}
                        value={userCategories.find((option) => option.value === formData.category)}
                        onChange={handleCategoryChange}
                        placeholder="Select a category"
                        required
                        styles={{
                          control: (provided) => ({
                            ...provided,
                            border: "none",
                            boxShadow: "none",
                            height: "100%",
                          }),
                          valueContainer: (provided) => ({
                            ...provided,
                            height: "38px",
                            padding: "0 8px",
                            display: "flex",
                            alignItems: "center",
                          }),
                          menu: (provided) => ({
                            ...provided,
                            zIndex: 9999,
                          }),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="coverImage" className="form-label">
                    Cover Image (Optional)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-image"></i>
                    </span>
                    <input type="file" className="form-control" id="coverImage" onChange={handleFileChange} />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="content" className="form-label">
                    Content
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-file-text"></i>
                    </span>
                    <textarea
                      className="form-control"
                      id="content"
                      name="content"
                      placeholder="Write your content here"
                      rows="6"
                      value={formData.content}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex gap-3 justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => navigate("/home")}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">
                    Publish Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateNewPost
