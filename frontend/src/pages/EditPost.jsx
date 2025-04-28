import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";  
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


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

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState({
    title: "",
    content: "",
    category: "",
    coverImage: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch post details when the component mounts
  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/posts/${postId}`
        );
        if (!response.ok) throw new Error("Failed to fetch post");

        const data = await response.json();
        setPost({
          title: data.title,
          content: data.content,
          category: data.category,
          coverImage: data.coverImage,
        });

        setImagePreview(
          data.coverImage ? `data:image/jpeg;base64,${data.coverImage}` : null
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Handle input change for form fields
  const handleChange = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  // Handle image change (for preview and upload)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission for post update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to edit a post.");

      const formData = new FormData();
      formData.append("title", post.title);
      formData.append("category", post.category);
      formData.append("content", post.content);
      if (newImage) formData.append("coverImage", newImage);

      const response = await fetch(
        `${API_BASE_URL}/api/posts/${postId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Failed to update post: ${errorMsg}`);
      }

      alert("Post updated successfully!");
      navigate(`/post/${postId}`);
    } catch (err) {
      console.error("Error updating post:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
                value={categoryOptions.find(option => option.value === post.category)}
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
                    src={imagePreview}
                    alt="Current Post Cover"
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-bold">Change Cover Image</label>
              <input
                type="file"
                className="form-control"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/post/${postId}`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Post"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPost;
