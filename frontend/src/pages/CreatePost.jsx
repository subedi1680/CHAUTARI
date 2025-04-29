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
                    <div className="form-control p-0" style={{ overflow: "hidden" }}>
                      <Select
                        options={categoryOptions}
                        value={categoryOptions.find((option) => option.value === formData.category)}
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
