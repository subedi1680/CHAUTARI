"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Select from "react-select"

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

function CreateNewPost() {
  const [formData, setFormData] = useState({
    title: "",
    category: "Community Discussions", // Updated default category
    coverImage: null,
    content: "",
  })
  const [error, setError] = useState(null)
  const navigate = useNavigate()

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
        throw new Error("Failed to create post. Make sure you are logged in.")
      }

      navigate("/home")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-4">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "600px", margin: "auto" }}>
          <h2 className="mb-3">Create New Post</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                name="title"
                placeholder="Enter title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Category</label>
              <Select
                options={categoryOptions}
                value={categoryOptions.find((option) => option.value === formData.category)}
                onChange={handleCategoryChange}
                placeholder="Select a category"
                required
              />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Cover Image (Optional)</label>
              <input type="file" className="form-control" onChange={handleFileChange} />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Content</label>
              <textarea
                className="form-control"
                name="content"
                placeholder="Write your content here"
                rows="5"
                value={formData.content}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            {error && <p className="text-danger">{error}</p>}
            <div className="d-flex justify-content-between mt-3">
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/home")}>
                Cancel
              </button>
              <button type="submit" className="btn btn-dark">
                Publish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateNewPost
