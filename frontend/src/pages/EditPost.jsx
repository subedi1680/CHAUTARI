"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Select from "react-select"
import UserAvatar from "../components/UserAvatar" // Add UserAvatar import
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Updated category options based on our new category structure
const categoryOptions = [
  // Main categories
  { value: "Community Discussions", label: "Community Discussions" },
  { value: "Technology", label: "Technology" },
  { value: "Arts & Culture", label: "Arts & Culture" },
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Education", label: "Education" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Travel & Places", label: "Travel & Places" },
  { value: "Food & Cuisine", label: "Food & Cuisine" },
  { value: "Sports & Fitness", label: "Sports & Fitness" },
  { value: "Entertainment", label: "Entertainment" },

  // Community Discussions subcategories
  { value: "Local News", label: "Local News" },
  { value: "Current Events", label: "Current Events" },
  { value: "Ask Me Anything", label: "Ask Me Anything" },
  { value: "Debates & Opinions", label: "Debates & Opinions" },
  { value: "Community Help", label: "Community Help" },

  // Technology subcategories
  { value: "Software & Apps", label: "Software & Apps" },
  { value: "Gadgets & Hardware", label: "Gadgets & Hardware" },
  { value: "Digital Trends", label: "Digital Trends" },
  { value: "Tech Support", label: "Tech Support" },
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },

  // Arts & Culture subcategories
  { value: "Visual Arts", label: "Visual Arts" },
  { value: "Literature & Poetry", label: "Literature & Poetry" },
  { value: "Music", label: "Music" },
  { value: "Cultural Traditions", label: "Cultural Traditions" },
  { value: "Festivals & Events", label: "Festivals & Events" },

  // Lifestyle subcategories
  { value: "Fashion & Style", label: "Fashion & Style" },
  { value: "Home & Living", label: "Home & Living" },
  { value: "Relationships", label: "Relationships" },
  { value: "Personal Development", label: "Personal Development" },
  { value: "Hobbies & Crafts", label: "Hobbies & Crafts" },

  // Education subcategories
  { value: "Academic Discussions", label: "Academic Discussions" },
  { value: "Learning Resources", label: "Learning Resources" },
  { value: "Student Life", label: "Student Life" },
  { value: "Career Development", label: "Career Development" },
  { value: "Language Learning", label: "Language Learning" },

  // Health & Wellness subcategories
  { value: "Mental Health", label: "Mental Health" },
  { value: "Nutrition", label: "Nutrition" },
  { value: "Fitness Tips", label: "Fitness Tips" },
  { value: "Medical Advice", label: "Medical Advice" },
  { value: "Mindfulness & Meditation", label: "Mindfulness & Meditation" },

  // Travel & Places subcategories
  { value: "Local Destinations", label: "Local Destinations" },
  { value: "International Travel", label: "International Travel" },
  { value: "Travel Tips", label: "Travel Tips" },
  { value: "Adventure Stories", label: "Adventure Stories" },
  { value: "Hidden Gems", label: "Hidden Gems" },

  // Food & Cuisine subcategories
  { value: "Recipes & Cooking", label: "Recipes & Cooking" },
  { value: "Restaurant Reviews", label: "Restaurant Reviews" },
  { value: "Local Delicacies", label: "Local Delicacies" },
  { value: "Healthy Eating", label: "Healthy Eating" },
  { value: "Food Photography", label: "Food Photography" },

  // Sports & Fitness subcategories
  { value: "Team Sports", label: "Team Sports" },
  { value: "Individual Sports", label: "Individual Sports" },
  { value: "Outdoor Activities", label: "Outdoor Activities" },
  { value: "Fitness Challenges", label: "Fitness Challenges" },
  { value: "Sports News", label: "Sports News" },

  // Entertainment subcategories
  { value: "Movies & TV Shows", label: "Movies & TV Shows" },
  { value: "Gaming", label: "Gaming" },
  { value: "Music Reviews", label: "Music Reviews" },
  { value: "Books & Comics", label: "Books & Comics" },
  { value: "Celebrity News", label: "Celebrity News" },
]

const EditPost = () => {
  const { postId } = useParams()
  const navigate = useNavigate()

  const [post, setPost] = useState({
    title: "",
    content: "",
    category: "",
    coverImage: "",
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newImage, setNewImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Fetch post details when the component mounts
  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID")
      setLoading(false)
      return
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`)
        if (!response.ok) throw new Error("Failed to fetch post")

        const data = await response.json()
        setPost({
          title: data.title,
          content: data.content,
          category: data.category,
          coverImage: data.coverImage,
        })

        setImagePreview(data.coverImage ? `data:image/jpeg;base64,${data.coverImage}` : null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  // Handle input change for form fields
  const handleChange = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value })
  }

  // Handle image change (for preview and upload)
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission for post update
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("token")
      if (!token) throw new Error("You must be logged in to edit a post.")

      const formData = new FormData()
      formData.append("title", post.title)
      formData.append("category", post.category)
      formData.append("content", post.content)
      if (newImage) formData.append("coverImage", newImage)

      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorMsg = await response.text()
        throw new Error(`Failed to update post: ${errorMsg}`)
      }

      alert("Post updated successfully!")
      navigate(`/post/${postId}`)
    } catch (err) {
      console.error("Error updating post:", err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-7 col-md-9 col-sm-11">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Edit Post</h2>
                <p className="text-muted">Update your post details</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading post details...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                        value={post.title}
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
                      <div className="form-control p-0" style={{ overflow: "hidden" }}>
                        <Select
                          options={categoryOptions}
                          value={categoryOptions.find((option) => option.value === post.category)}
                          onChange={(selectedOption) => setPost({ ...post, category: selectedOption.value })}
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
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
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
                        rows="6"
                        value={post.content}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="mb-3">
                      <label className="form-label">Current Image</label>
                      <div className="text-center">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Current Post Cover"
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="coverImage" className="form-label">
                      Change Cover Image
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-image"></i>
                      </span>
                      <input
                        type="file"
                        className="form-control"
                        id="coverImage"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-3 justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => navigate(`/post/${postId}`)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        "Update Post"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPost
