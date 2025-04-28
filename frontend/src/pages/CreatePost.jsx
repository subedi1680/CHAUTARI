import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from 'react-select'; 


const categoryOptions = [
  { value: "General & Trending", label: "General & Trending" },
  { value: "News & Current Events", label: "News & Current Events" },
  { value: "Ask Me Anything (AMA)", label: "Ask Me Anything (AMA)" },
  { value: "Viral Content & Memes", label: "Viral Content & Memes" },
  { value: "Controversial Discussions", label: "Controversial Discussions" },
  { value: "Debates & Opinions", label: "Debates & Opinions" },
  { value: "Technology & Innovation", label: "Technology & Innovation" },
  { value: "Software Development", label: "Software Development" },
  { value: "Artificial Intelligence (AI)", label: "Artificial Intelligence (AI)" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Gadgets & Hardware", label: "Gadgets & Hardware" },
  { value: "Web3 & Cryptocurrency", label: "Web3 & Cryptocurrency" },
  { value: "Tech Support", label: "Tech Support" },
  { value: "Science & Academia", label: "Science & Academia" },
  { value: "Physics & Astronomy", label: "Physics & Astronomy" },
  { value: "Biology & Medicine", label: "Biology & Medicine" },
  { value: "Environmental Science", label: "Environmental Science" },
  { value: "Psychology & Neuroscience", label: "Psychology & Neuroscience" },
  { value: "Engineering", label: "Engineering" },
  { value: "Research & Academia", label: "Research & Academia" },
  { value: "Arts & Entertainment", label: "Arts & Entertainment" },
  { value: "Visual Arts (Painting, Digital Art)", label: "Visual Arts (Painting, Digital Art)" },
  { value: "Film & TV Shows", label: "Film & TV Shows" },
  { value: "Music Genres & Artists", label: "Music Genres & Artists" },
  { value: "Books & Literature (Fantasy, Sci-Fi, Non-Fiction)", label: "Books & Literature (Fantasy, Sci-Fi, Non-Fiction)" },
  { value: "Theater & Performing Arts", label: "Theater & Performing Arts" },
  { value: "Fan Theories & Fandom Discussions", label: "Fan Theories & Fandom Discussions" },
  { value: "Lifestyle & Wellness", label: "Lifestyle & Wellness" },
  { value: "Fitness & Nutrition", label: "Fitness & Nutrition" },
  { value: "Mental Health & Mindfulness", label: "Mental Health & Mindfulness" },
  { value: "Travel & Adventure", label: "Travel & Adventure" },
  { value: "Fashion & Beauty", label: "Fashion & Beauty" },
  { value: "Home Improvement", label: "Home Improvement" },
  { value: "Cooking & Recipes", label: "Cooking & Recipes" },
  { value: "Hobbies & Interests", label: "Hobbies & Interests" },
  { value: "Gaming (Video Games, Esports, Tabletop)", label: "Gaming (Video Games, Esports, Tabletop)" },
  { value: "DIY & Crafts", label: "DIY & Crafts" },
  { value: "Photography & Videography", label: "Photography & Videography" },
  { value: "Gardening", label: "Gardening" },
  { value: "Collectibles (Vinyl, Toys, Memorabilia)", label: "Collectibles (Vinyl, Toys, Memorabilia)" },
  { value: "Outdoor Activities (Hiking, Camping)", label: "Outdoor Activities (Hiking, Camping)" },
  { value: "Society & Culture", label: "Society & Culture" },
  { value: "Politics & Governance", label: "Politics & Governance" },
  { value: "Social Justice & Activism", label: "Social Justice & Activism" },
  { value: "Philosophy & Ethics", label: "Philosophy & Ethics" },
  { value: "History & Archaeology", label: "History & Archaeology" },
  { value: "Language & Linguistics", label: "Language & Linguistics" },
  { value: "Relationships & Dating", label: "Relationships & Dating" },
  { value: "Career & Finance", label: "Career & Finance" },
  { value: "Job Hunting & Resumes", label: "Job Hunting & Resumes" },
  { value: "Entrepreneurship", label: "Entrepreneurship" },
  { value: "Investing & Personal Finance", label: "Investing & Personal Finance" },
  { value: "Frugal Living", label: "Frugal Living" },
  { value: "Industry-Specific Discussions (Healthcare, Tech, etc.)", label: "Industry-Specific Discussions (Healthcare, Tech, etc.)" },
  { value: "Education & Learning", label: "Education & Learning" },
  { value: "Study Tips & Resources", label: "Study Tips & Resources" },
  { value: "Online Courses & Certifications", label: "Online Courses & Certifications" },
  { value: "Career Advice", label: "Career Advice" },
  { value: "STEM Education", label: "STEM Education" },
  { value: "Language Learning", label: "Language Learning" },
  { value: "Humor & Creativity", label: "Humor & Creativity" },
  { value: "Memes & Jokes", label: "Memes & Jokes" },
  { value: "Satire & Parodies", label: "Satire & Parodies" },
  { value: "Creative Writing Prompts", label: "Creative Writing Prompts" },
  { value: "Fan Fiction", label: "Fan Fiction" },
  { value: "Role-Playing Games (RPGs)", label: "Role-Playing Games (RPGs)" },
  { value: "Niche & Specialized", label: "Niche & Specialized" },
  { value: "Paranormal & Supernatural", label: "Paranormal & Supernatural" },
  { value: "Minimalism & Sustainability", label: "Minimalism & Sustainability" },
  { value: "Parenting & Family Life", label: "Parenting & Family Life" },
  { value: "Automotive & DIY Repairs", label: "Automotive & DIY Repairs" },
  { value: "Pet Care & Animal Lovers", label: "Pet Care & Animal Lovers" },
  { value: "Regional & Local", label: "Regional & Local" },
  { value: "City/Country-Specific Discussions", label: "City/Country-Specific Discussions" },
  { value: "Cultural Exchange", label: "Cultural Exchange" },
  { value: "Local News & Events", label: "Local News & Events" },
  { value: "Travel Guides", label: "Travel Guides" },
  { value: "Community & Meta", label: "Community & Meta" },
  { value: "Site Feedback & Suggestions", label: "Site Feedback & Suggestions" },
  { value: "User Introductions", label: "User Introductions" },
  { value: "Moderation Updates", label: "Moderation Updates" },
  { value: "Bug Reports", label: "Bug Reports" },
  { value: "Community Challenges & Events", label: "Community Challenges & Events" },
  { value: "Support & Advice", label: "Support & Advice" },
  { value: "Mental Health Support", label: "Mental Health Support" },
  { value: "Career Counseling", label: "Career Counseling" },
  { value: "Relationship Advice", label: "Relationship Advice" },
  { value: "Financial Guidance", label: "Financial Guidance" },
  { value: "Technical Help", label: "Technical Help" }
];

function CreateNewPost() {
  const [formData, setFormData] = useState({
    title: "",
    category: "General & Trending",
    coverImage: null,
    content: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, coverImage: e.target.files[0] }));
  };

  const handleCategoryChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, category: selectedOption.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.category || !formData.content) {
      setError("Title, category, and content are required");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("content", formData.content);
    if (formData.coverImage) {
      formDataToSend.append("coverImage", formData.coverImage);
    }

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please log in first.");
        return;
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to create post. Make sure you are logged in.");
      }

      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

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
                value={categoryOptions.find(option => option.value === formData.category)}
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
              <button type="submit" className="btn btn-dark">Publish</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateNewPost;
