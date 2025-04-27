import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./PostDetails.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const socket = io(API_BASE_URL, { withCredentials: true });

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};

function PostDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({});
  const [newComment, setNewComment] = useState("");
  const [commentImage, setCommentImage] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  const commentInputRef = useRef(null);
  const navigate = useNavigate();

  const loggedInUserId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!postId || postId === "undefined") {
      setError("Invalid Post ID");
      return;
    }

    fetchPost();
    fetchComments();

    socket.on("postReaction", (updatedPost) => {
      if (updatedPost._id === postId) {
        setPost(updatedPost);
      }
    });

    socket.on("newComment", (comment) => {
      if (comment.post === postId) {
        setComments((prev) => [comment, ...prev]);
      }
    });

    socket.on("deleteComment", (data) => {
      if (data.postId === postId) {
        setComments((prev) => prev.filter((c) => c._id !== data.commentId));
      }
    });

    socket.on("newReply", (reply) => {
      setReplies((prev) => ({
        ...prev,
        [reply.comment]: [reply, ...(prev[reply.comment] || [])],
      }));
    });

    socket.on("deleteReply", ({ replyId, commentId }) => {
      setReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId]?.filter((r) => r._id !== replyId),
      }));
    });

    return () => {
      socket.off("postReaction");
      socket.off("newComment");
      socket.off("deleteComment");
      socket.off("newReply");
      socket.off("deleteReply");
    };
  }, [postId]);

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

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
      data.forEach((comment) => fetchReplies(comment._id));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`);
      if (!res.ok) throw new Error("Failed to fetch replies");
      const data = await res.json();
      setReplies((prev) => ({ ...prev, [commentId]: data }));
    } catch (err) {
      console.error("Error fetching replies:", err);
    }
  };

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
      if (commentImage) formData.append("image", commentImage);

      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const createdComment = await res.json();
      setComments((prev) => [createdComment, ...prev]);

      // Emit commentCount update
      socket.emit("commentCountUpdated", { postId: postId, action: "add" });

      setNewComment("");
      setCommentImage(null);
      if (commentInputRef.current) commentInputRef.current.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!token) {
      setError("You must be logged in to reply.");
      return;
    }

    const replyText = replyInputs[commentId]?.text || "";
    const replyImage = replyInputs[commentId]?.image || null;

    if (!replyText.trim() && !replyImage) {
      setError("Cannot post empty reply.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", replyText);
      if (replyImage) formData.append("image", replyImage);

      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post reply");

      const createdReply = await res.json();
      setReplies((prev) => ({
        ...prev,
        [commentId]: [createdReply, ...(prev[commentId] || [])],
      }));

      setReplyInputs((prev) => ({ ...prev, [commentId]: { text: "", image: null } }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) return;
    if (!window.confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((comment) => comment._id !== commentId));

      // Emit commentCount update
      socket.emit("commentCountUpdated", { postId: postId, action: "remove" });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReply = async (replyId, commentId) => {
    if (!token) return;
    if (!window.confirm("Delete this reply?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/replies/${replyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete reply");

      setReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId]?.filter((r) => r._id !== replyId),
      }));
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleReplyInputChange = (commentId, field, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: { ...prev[commentId], [field]: value },
    }));
  };

  const handleImageClick = (imageSrc) => {
    setImagePreviewSrc(imageSrc);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setImagePreviewSrc(null);
  };

  const updateReactions = (postId, updatedData) => {
    if (postId === post._id) {
      setPost((prevPost) => ({
        ...prevPost,
        likes: updatedData.likes,
        dislikes: updatedData.dislikes,
      }));
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like post");
      const updatedPost = await res.json();
      updateReactions(postId, updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to dislike post");
      const updatedPost = await res.json();
      updateReactions(postId, updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <p className="text-danger text-center mt-5">{error}</p>;
  if (!post) return <p className="text-center mt-5">Loading post details...</p>;

  return (
    <div className="container d-flex flex-column align-items-center mt-5 mb-5">
      <div className="card shadow-lg p-4 mb-4 position-relative" style={{ maxWidth: "800px", width: "100%" }}>
        <button
          className="btn btn-secondary btn-sm position-absolute"
          style={{ top: "15px", left: "15px" }}
          onClick={() => navigate("/home")}
        >
          ← Back
        </button>

        <h2 className="fw-bold mt-4">{post.title}</h2>

        <small className="text-muted">{formatTimeAgo(post.createdAt)}</small>

        {post.coverImage && (
          <img
            src={`data:image/jpeg;base64,${post.coverImage}`}
            className="img-fluid rounded my-3 preview-img"
            onClick={() => handleImageClick(`data:image/jpeg;base64,${post.coverImage}`)}
            style={{ cursor: "pointer" }}
          />
        )}

        <p style={{ fontSize: 18 }}>{post.content}</p>

        <div className="d-flex justify-content-start align-items-center gap-3 mt-3">
          <button
            className="btn btn-outline-success btn-sm"
            onClick={handleLike}
            disabled={!token}
          >
            👍 {post.likes || 0}
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleDislike}
            disabled={!token}
          >
            👎 {post.dislikes || 0}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="card shadow p-4" style={{ maxWidth: "800px", width: "100%" }}>
        <h4 className="mb-4">Comments</h4>

        {token ? (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <textarea
              className="form-control mb-2"
              rows="3"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              ref={commentInputRef}
            />
            <input
              type="file"
              accept="image/*"
              className="form-control mb-2"
              onChange={(e) => setCommentImage(e.target.files[0])}
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <div className="alert alert-info mb-4">
            Please <a href="/login">login</a> to comment.
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment._id} className="card p-3 mb-3">
            <div className="d-flex justify-content-between">
              <div>
                <h6 className="mb-1">{comment.user?.username || "Unknown User"}</h6>
                <small className="text-muted">{formatTimeAgo(comment.createdAt)}</small>
              </div>
              {comment.user?._id === loggedInUserId && (
                <button className="btn btn-sm text-danger" onClick={() => handleDeleteComment(comment._id)}>
                  Delete
                </button>
              )}
            </div>

            <p>{comment.content}</p>
            {comment.image && (
              <img
                src={comment.image}
                alt="Comment"
                className="img-fluid rounded my-2 preview-img"
                style={{ maxWidth: "500px", cursor: "pointer" }}
                onClick={() => handleImageClick(comment.image)}
              />
            )}

            {replies[comment._id]?.map((reply) => (
              <div key={reply._id} className="bg-light rounded p-2 my-2 ms-4">
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>{reply.user?.username || "Unknown"}</strong>
                    <small className="text-muted ms-2">{formatTimeAgo(reply.createdAt)}</small>
                  </div>
                  {reply.user?._id === loggedInUserId && (
                    <button className="btn btn-sm text-danger" onClick={() => handleDeleteReply(reply._id, comment._id)}>
                      Delete
                    </button>
                  )}
                </div>
                <p className="mb-1">{reply.content}</p>
                {reply.image && (
                  <img
                    src={reply.image}
                    alt="Reply"
                    className="img-fluid rounded my-2 preview-img"
                    style={{ maxWidth: "500px", cursor: "pointer" }}
                    onClick={() => handleImageClick(reply.image)}
                  />
                )}
              </div>
            ))}

            {token && (
              <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-2 ms-4">
                <textarea
                  className="form-control mb-2"
                  rows="2"
                  placeholder="Write a reply..."
                  value={replyInputs[comment._id]?.text || ""}
                  onChange={(e) => handleReplyInputChange(comment._id, "text", e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mb-2"
                  onChange={(e) => handleReplyInputChange(comment._id, "image", e.target.files[0])}
                />
                <button className="btn btn-success btn-sm">Post Reply</button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Image Preview */}
      {showImagePreview && (
        <div
          className="modal show"
          tabIndex="-1"
          style={{
            display: "block",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1050,
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Optional: background dimming effect
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeImagePreview}
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={imagePreviewSrc}
                  className="img-fluid zoomable"
                  alt="Preview"
                  style={{ cursor: "zoom-in", maxHeight: "100vh", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetails;
