import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const loggedInUserId = sessionStorage.getItem("userId");

  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID");
      return;
    }

    const fetchPostDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/posts/${postId}`
        );
        if (!response.ok) throw new Error("Failed to fetch post");

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleDelete = async () => {
    if (!post) return;

    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("You are not logged in. Please log in first.");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/posts/${postId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete post");
        }

        alert("Post deleted successfully!");
        navigate("/home");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (error) {
    return <p className="text-danger text-center mt-5">{error}</p>;
  }

  if (!post) {
    return <p className="text-center mt-5">Loading post details...</p>;
  }

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div
        className="card shadow-lg p-4 position-relative"
        style={{ maxWidth: "800px", width: "100%" }}
      >
        <button
          className="btn btn-secondary btn-sm position-absolute"
          style={{ top: "10px", left: "10px" }}
          onClick={() => navigate("/home")}
        >
          ← Back
        </button>

        {post.user && post.user._id === loggedInUserId && (
          <div
            className="position-absolute"
            style={{ top: "10px", right: "10px" }}
          >
            <button
              className="btn btn-warning btn-sm me-2"
              onClick={() => navigate(`/edit-post/${postId}`)}
            >
              ✏️ Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>
        )}

        <h2 className="fw-bold mt-4">{post.title}</h2>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge bg-primary">
            {post.category || "Uncategorized"}
          </span>
          <p className="text-muted small">
            by {post.user?.username || "Unknown User"}{" "}
            {new Date(post.updatedAt).getTime() !==
              new Date(post.createdAt).getTime() && (
              <span className="text-muted">(Edited)</span>
            )}
          </p>
        </div>

        {post.coverImage && (
          <div className="text-center">
            <img
              src={`data:image/jpeg;base64,${post.coverImage}`}
              alt="Post Cover"
              className="img-fluid rounded mb-3"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "600px",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        <p
          className="text-dark"
          style={{ fontSize: "18px", lineHeight: "1.6" }}
        >
          {post.content}
        </p>
      </div>
    </div>
  );
}

export default PostDetails;
