import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateNewPost() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
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
        <div
          className="card p-4 shadow-lg"
          style={{ maxWidth: "600px", margin: "auto" }}
        >
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
              <input
                type="text"
                className="form-control"
                name="category"
                placeholder="Enter category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Cover Image (Optional)</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
              />
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/home")}
              >
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
  );
}

export default CreateNewPost;
