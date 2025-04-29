"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import UserContext from "../components/UserContext"
import { categoryStructure, categoryImages } from "../utils/categoryData"
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
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const user = await response.json()
        if (user.categorySetupCompleted) {
          navigate("/home")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}/categories`, {
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
        const errorData = await response.json()
        throw new Error(errorData.msg || "Failed to save category setup")
      }
    } catch (error) {
      console.error("Failed to save category setup:", error)
      alert("Failed to save your categories. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="category-setup-container">
      <div className="container">
        <div className="category-header">
          <h2>Personalize Your CHAUTARI Experience</h2>
          <p>
            Select topics that interest you to customize your feed. We&apos;ll show you more content from your selected
            categories.
          </p>
        </div>

        <div className="selected-count">
          You&apos;ve selected <span>{selectedCategories.length}</span>{" "}
          {selectedCategories.length === 1 ? "category" : "categories"}
          {selectedCategories.length > 0 && ". Great choice!"}
        </div>

        {/* Main categories grid */}
        <div className="category-grid">
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

        <div className="action-buttons">
          <button onClick={handleSubmit} className="save-button" disabled={selectedCategories.length === 0 || loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategorySetup
