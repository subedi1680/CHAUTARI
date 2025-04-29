"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Select from "react-select"
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
    <div className="container mt-5">
      <div className="card shadow p-4" style={{ maxWidth: "600px", margin: "auto" }}>
        <h2 className="text-center mb-4">Edit Post</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p className="text-center">Loading post details...</p>
        ) : (
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="mb-3">
              <label className="form-label fw-bold">Title</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={post.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Category</label>
              <Select
                options={categoryOptions}
                value={categoryOptions.find((option) => option.value === post.category)}
                onChange={(selectedOption) => setPost({ ...post, category: selectedOption.value })}
                placeholder="Select a category"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Content</label>
              <textarea
                name="content"
                className="form-control"
                rows="5"
                value={post.content}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {imagePreview && (
              <div className="mb-3 text-center">
                <label className="form-label fw-bold">Current Image</label>
                <div>
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Current Post Cover"
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-bold">Change Cover Image</label>
              <input type="file" className="form-control" onChange={handleImageChange} accept="image/*" />
            </div>

            <div className="d-flex justify-content-between">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/post/${postId}`)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Update Post"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditPost
