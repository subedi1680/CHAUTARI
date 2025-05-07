"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import UserContext from "../components/UserContext"
import { categoryStructure, categoryImages } from "../utils/categoryData"
import { API_BASE_URL } from "../config"
import "./CategorySetup.css"

const CategorySetup = () => {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [loading, setLoading] = useState(false)
  const { markCategorySetupCompleted } = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    // If category setup is already completed, skip the setup and navigate to home
    const userId = sessionStorage.getItem("userId")
    const token = sessionStorage.getItem("token")

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          console.error("Error fetching user data:", response.statusText)
          return
        }

        const user = await response.json()
        if (user.categorySetupCompleted) {
          navigate("/home")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // Continue with setup if we can't verify completion status
      }
    }

    if (userId && token) {
      fetchUserData()
    }
  }, [navigate])

  const handleCategoryClick = (category, index) => {
    // Toggle selection
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    )

    // Toggle expanded state for categories with similar items
    if (categoryStructure[index].similar.length > 0) {
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: !prev[category],
      }))
    }
  }

  const handleSimilarCategoryClick = (similarCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(similarCategory) ? prev.filter((item) => item !== similarCategory) : [...prev, similarCategory],
    )
  }

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      alert("Please select at least one category")
      return
    }

    setLoading(true)
    const userId = sessionStorage.getItem("userId")
    const token = sessionStorage.getItem("token")

    try {
      // Send the updated categories and mark category setup as completed in the database
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: selectedCategories }),
      })

      if (response.ok) {
        markCategorySetupCompleted()
        navigate("/home")
      } else {
        const errorData = await response.json().catch(() => ({ msg: "Failed to save category setup" }))
        throw new Error(errorData.msg || "Failed to save category setup")
      }
    } catch (error) {
      console.error("Failed to save category setup:", error)
      // Continue anyway to prevent users from getting stuck
      alert("There was an issue saving your categories, but you can continue using the app.")
      markCategorySetupCompleted()
      navigate("/home")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-1">Personalize Your CHAUTARI Experience</h2>
                <p className="text-muted">Select topics that interest you to customize your feed.</p>
              </div>

              <div className="selected-count mb-4">
                You&apos;ve selected <span className="text-primary fw-bold">{selectedCategories.length}</span>{" "}
                {selectedCategories.length === 1 ? "category" : "categories"}
                {selectedCategories.length > 0 && ". Great choice!"}
              </div>

              {/* Main categories grid */}
              <div className="category-grid mb-4">
                {categoryStructure.map((category, index) => (
                  <div
                    key={index}
                    className={`category-card ${selectedCategories.includes(category.name) ? "selected" : ""}`}
                    onClick={() => handleCategoryClick(category.name, index)}
                  >
                    <img
                      src={categoryImages[category.name] || "/placeholder.svg"}
                      alt={category.name}
                      className="category-image"
                    />
                    <div className="category-name">{category.name}</div>
                  </div>
                ))}
              </div>

              {/* Categories with similar items */}
              <div className="categories-wrapper">
                {categoryStructure.map(
                  (category, index) =>
                    category.similar.length > 0 &&
                    expandedCategories[category.name] && (
                      <div className="category-group" key={`group-${index}`}>
                        <div className="category-item">
                          <div
                            className={`category-card ${selectedCategories.includes(category.name) ? "selected" : ""}`}
                            onClick={() => handleCategoryClick(category.name, index)}
                          >
                            <img
                              src={categoryImages[category.name] || "/placeholder.svg"}
                              alt={category.name}
                              className="category-image"
                            />
                            <div className="category-name">{category.name}</div>
                          </div>

                          <div className="similar-label">Similar to {category.name}</div>

                          <div className="similar-categories">
                            {category.similar.map((similarCategory, idx) => (
                              <div
                                key={idx}
                                className={`similar-category-card ${
                                  selectedCategories.includes(similarCategory) ? "selected" : ""
                                }`}
                                onClick={() => handleSimilarCategoryClick(similarCategory)}
                              >
                                <img
                                  src={categoryImages[similarCategory] || "/placeholder.svg"}
                                  alt={similarCategory}
                                  className="similar-category-image"
                                />
                                <div className="similar-category-name">{similarCategory}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                )}
              </div>

              <div className="d-grid mt-4">
                <button
                  onClick={handleSubmit}
                  className="btn btn-primary btn-lg rounded-pill"
                  disabled={selectedCategories.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategorySetup
