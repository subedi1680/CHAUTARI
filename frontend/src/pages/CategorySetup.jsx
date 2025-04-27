import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../components/UserContext"; // Import the UserContext

const allCategories = [
  {
    name: "General & Trending",
    similar: []
  },
  {
    name: "News & Current Events",
    similar: []
  },
  {
    name: "Ask Me Anything (AMA)",
    similar: []
  },
  {
    name: "Viral Content & Memes",
    similar: []
  },
  {
    name: "Controversial Discussions",
    similar: []
  },
  {
    name: "Debates & Opinions",
    similar: []
  },
  {
    name: "Technology & Innovation",
    similar: [
      "Software Development", 
      "Artificial Intelligence (AI)", 
      "Cybersecurity", 
      "Gadgets & Hardware", 
      "Web3 & Cryptocurrency", 
      "Tech Support"
    ]
  },
  {
    name: "Science & Academia",
    similar: [
      "Physics & Astronomy", 
      "Biology & Medicine", 
      "Environmental Science", 
      "Psychology & Neuroscience", 
      "Engineering", 
      "Research & Academia"
    ]
  },
  {
    name: "Arts & Entertainment",
    similar: [
      "Visual Arts (Painting, Digital Art)", 
      "Film & TV Shows", 
      "Music Genres & Artists", 
      "Books & Literature (Fantasy, Sci-Fi, Non-Fiction)", 
      "Theater & Performing Arts", 
      "Fan Theories & Fandom Discussions"
    ]
  },
  {
    name: "Lifestyle & Wellness",
    similar: [
      "Fitness & Nutrition", 
      "Mental Health & Mindfulness", 
      "Travel & Adventure", 
      "Fashion & Beauty", 
      "Home Improvement", 
      "Cooking & Recipes"
    ]
  },
  {
    name: "Hobbies & Interests",
    similar: [
      "Gaming (Video Games, Esports, Tabletop)", 
      "DIY & Crafts", 
      "Photography & Videography", 
      "Gardening", 
      "Collectibles (Vinyl, Toys, Memorabilia)", 
      "Outdoor Activities (Hiking, Camping)"
    ]
  },
  {
    name: "Career & Finance",
    similar: [
      "Job Hunting & Resumes", 
      "Entrepreneurship", 
      "Investing & Personal Finance", 
      "Frugal Living", 
      "Industry-Specific Discussions (Healthcare, Tech, etc.)"
    ]
  },
  {
    name: "Society & Culture",
    similar: [
      "Politics & Governance", 
      "Social Justice & Activism", 
      "Philosophy & Ethics", 
      "History & Archaeology", 
      "Language & Linguistics", 
      "Relationships & Dating"
    ]
  },
  {
    name: "Education & Learning",
    similar: [
      "Study Tips & Resources", 
      "Online Courses & Certifications", 
      "Career Advice", 
      "STEM Education", 
      "Language Learning"
    ]
  },
  {
    name: "Humor & Creativity",
    similar: [
      "Memes & Jokes", 
      "Satire & Parodies", 
      "Creative Writing Prompts", 
      "Fan Fiction", 
      "Role-Playing Games (RPGs)"
    ]
  },
  {
    name: "Niche & Specialized",
    similar: [
      "Paranormal & Supernatural", 
      "Minimalism & Sustainability", 
      "Parenting & Family Life", 
      "Automotive & DIY Repairs", 
      "Pet Care & Animal Lovers"
    ]
  },
  {
    name: "Regional & Local",
    similar: [
      "City/Country-Specific Discussions", 
      "Cultural Exchange", 
      "Local News & Events", 
      "Travel Guides"
    ]
  },
  {
    name: "Community & Meta",
    similar: [
      "Site Feedback & Suggestions", 
      "User Introductions", 
      "Moderation Updates", 
      "Bug Reports", 
      "Community Challenges & Events"
    ]
  },
  {
    name: "Support & Advice",
    similar: [
      "Mental Health Support", 
      "Career Counseling", 
      "Relationship Advice", 
      "Financial Guidance", 
      "Technical Help"
    ]
  }
];

const CategorySetup = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showSimilarCategories, setShowSimilarCategories] = useState({});
  const { markCategorySetupCompleted } = useContext(UserContext); // markCategorySetupCompleted from context
  const navigate = useNavigate();

  useEffect(() => {
    // If category setup is already completed, skip the setup and navigate to home
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");

    const fetchUserData = async () => {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      if (user.categorySetupCompleted) {
        navigate("/home");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleSimilarCategoryChange = (similarCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(similarCategory)
        ? prev.filter((item) => item !== similarCategory)
        : [...prev, similarCategory]
    );
  };

  const handleCategoryToggle = (category) => {
    setShowSimilarCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSubmit = async () => {
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");

    // Send the updated categories and mark category setup as completed in the database
    const response = await fetch(`http://localhost:5000/api/users/${userId}/categories`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ categories: selectedCategories }),
    });

    if (response.ok) {
      markCategorySetupCompleted(); // Mark setup completed in context
      navigate("/home"); // Ensure the navigation happens only after a successful update
    } else {
      console.error("Failed to save category setup");
    }
  };

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Select Your Categories</h2>
      <div className="row">
        {allCategories.map((category, index) => (
          <div key={index} className="col-md-4 mb-3">
            <div className="category-card">
              <h5>{category.name}</h5>
              <div className="form-check">
                <input
                  type="checkbox"
                  id={category.name}
                  checked={selectedCategories.includes(category.name)}
                  onChange={() => handleCategoryChange(category.name)}
                  className="form-check-input"
                />
                <label htmlFor={category.name} className="form-check-label">
                  Select {category.name}
                </label>
              </div>

              {/* Show similar categories only if the similar array is not empty */}
              {category.similar.length > 0 && (
                <div className="mt-3">
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={() => handleCategoryToggle(category.name)}
                  >
                    {showSimilarCategories[category.name] ? "Hide" : "Show"} Similar Categories
                  </button>

                  {showSimilarCategories[category.name] && (
                    <div className="similar-categories mt-2">
                      <h6>Similar Categories:</h6>
                      <ul>
                        {category.similar.map((similarCategory, idx) => (
                          <li key={idx}>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                id={similarCategory}
                                checked={selectedCategories.includes(similarCategory)}
                                onChange={() => handleSimilarCategoryChange(similarCategory)}
                                className="form-check-input"
                              />
                              <label htmlFor={similarCategory} className="form-check-label">
                                {similarCategory}
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <button onClick={handleSubmit} className="btn btn-dark">Save and Go to Home</button>
      </div>
    </div>
  );
};

export default CategorySetup;
