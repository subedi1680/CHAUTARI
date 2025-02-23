import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/posts/${postId}`
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

  const handleChange = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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
        `http://localhost:5000/api/posts/${postId}`,
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
      <div
        className="card shadow p-4"
        style={{ maxWidth: "600px", margin: "auto" }}
      >
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
              <input
                type="text"
                name="category"
                className="form-control"
                value={post.category}
                onChange={handleChange}
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
