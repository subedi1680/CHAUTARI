// frontend/src/pages/PostDetails.jsx

import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const socket = io(API_BASE_URL, { withCredentials: true });

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentImage, setCommentImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const commentInputRef = useRef(null);
  const navigate = useNavigate();

  const loggedInUserId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID");
      return;
    }

    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPost();
    fetchComments();

    socket.on("postReaction", (updatedPost) => {
      if (updatedPost._id === postId) {
        setPost(updatedPost);
      }
    });

    socket.on("newComment", (comment) => {
      if (comment.post === postId) {
        setComments((prevComments) => [comment, ...prevComments]);
      }
    });

    socket.on("deleteComment", (data) => {
      if (data.postId === postId) {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== data.commentId)
        );
      }
    });

    return () => {
      socket.off("postReaction");
      socket.off("newComment");
      socket.off("deleteComment");
    };
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // ⭐ Corrected: Submit comment dynamically without reloading
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("You must be logged in to comment.");
      return;
    }

    if (!newComment.trim() && !commentImage) {
      setError("Cannot post empty comment.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", newComment);
      if (commentImage) {
        formData.append("image", commentImage);
      }

      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const createdComment = await res.json();

      // Dynamically add the new comment to the top
      setComments((prevComments) => [createdComment, ...prevComments]);

      setNewComment("");
      setCommentImage(null);
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) return;

    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to delete comment");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleLike = async () => {
    if (!token) {
      setError("You must be logged in to like a post.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error liking the post");
      const updatedPost = await res.json();
      setPost(updatedPost);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDislike = async () => {
    if (!token) {
      setError("You must be logged in to dislike a post.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error disliking the post");
      const updatedPost = await res.json();
      setPost(updatedPost);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete post");
        alert("Post deleted successfully!");
        navigate("/home");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (error) return <p className="text-danger text-center mt-5">{error}</p>;
  if (!post) return <p className="text-center mt-5">Loading post details...</p>;

  const hasLiked = post.likedBy?.includes(loggedInUserId);
  const hasDisliked = post.dislikedBy?.includes(loggedInUserId);

  return (
    <div className="container d-flex flex-column align-items-center mt-5 mb-5">
      {/* Post Card */}
      <div
        className="card shadow-lg p-4 position-relative mb-4"
        style={{ maxWidth: "800px", width: "100%" }}
      >
        <button
          className="btn btn-secondary btn-sm position-absolute"
          style={{ top: 10, left: 10 }}
          onClick={() => navigate("/home")}
        >
          ← Back
        </button>

        {post.user?._id === loggedInUserId && (
          <div className="position-absolute" style={{ top: 10, right: 10 }}>
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
          <span className="badge bg-primary">{post.category || "Uncategorized"}</span>
          <p className="text-muted small">
            by {post.user?.username || "Unknown User"}{" "}
            {post.createdAt !== post.updatedAt && (
              <span className="text-muted">(Edited)</span>
            )}
          </p>
        </div>

        {post.coverImage && (
          <div className="text-center mb-3">
            <img
              src={`data:image/jpeg;base64,${post.coverImage}`}
              alt="Post Cover"
              className="img-fluid rounded"
              style={{
                maxHeight: 600,
                objectFit: "contain",
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        )}

        <p className="text-dark" style={{ fontSize: 18, lineHeight: 1.6 }}>
          {post.content}
        </p>

        <div className="d-flex align-items-center gap-3 mt-4">
          <button
            className={`btn btn-sm btn-${hasLiked ? "danger" : "outline-danger"}`}
            onClick={handleLike}
          >
            {hasLiked ? "❤️ Unlike" : "🤍 Like"} {post.likes}
          </button>
          <button
            className={`btn btn-sm btn-${hasDisliked ? "secondary" : "outline-secondary"}`}
            onClick={handleDislike}
          >
            {hasDisliked ? "👎 Dislike" : "👎 Dislike"} {post.dislikes}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div
        className="card shadow p-4"
        style={{ maxWidth: "800px", width: "100%" }}
      >
        <h4 className="mb-4">Comments</h4>

        {/* Comment Form */}
        {token ? (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                ref={commentInputRef}
                required={!commentImage}
              ></textarea>
            </div>

            {/* File input */}
            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setCommentImage(e.target.files[0])}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <div className="alert alert-info mb-4">
            Please <a href="/login">login</a> to comment on this post.
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="text-muted">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="card mb-3 p-3"
                style={{ borderLeft: "4px solid #007bff" }}
              >
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="mb-1">{comment.user?.username || "Unknown User"}</h6>
                    <p className="text-muted small">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {comment.user?._id === loggedInUserId && (
                    <button
                      className="btn btn-sm text-danger"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="mb-2">{comment.content}</p>

                {comment.image && (
                  <img
                    src={comment.image}
                    alt="Comment Attachment"
                    className="img-fluid rounded mt-2"
                    style={{ maxWidth: "300px" }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PostDetails;
