import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function HomePage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format from server");
        }
        const sortedPosts = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPosts(sortedPosts);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    fetchPosts();

    // Fetch user profile if on profile tab and user is logged in
    if (activeTab === "profile" && token && userId) {
      fetchUserProfile();
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handlePostClick = (postId) => {
    if (!postId || postId === "undefined") {
      console.error("Invalid postId:", postId);
      return;
    }
    navigate(`/post/${postId}`);
  };

  const updateReactions = (postId, updatedData) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: updatedData.likes,
              dislikes: updatedData.dislikes,
            }
          : post
      )
    );
  };

  const handleLike = async (postId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to like post");
      const updatedPost = await res.json();
      updateReactions(postId, updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async (postId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/posts/${postId}/dislike`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to dislike post");
      const updatedPost = await res.json();
      updateReactions(postId, updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="d-flex vh-100">
      <div className="p-3 border-end bg-light" style={{ width: "250px" }}>
        <h5 className="fw-bold">Home Page</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
              style={{
                border: "none",
                background: "none",
                padding: "5px",
                cursor: "pointer",
              }}
            >
              Feed
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
              style={{
                border: "none",
                background: "none",
                padding: "5px",
                cursor: "pointer",
              }}
            >
              Profile
            </button>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 p-4">
        {activeTab === "posts" && (
          <>
            <h4>Posts Feed</h4>
            <div style={{ maxWidth: "800px" }}>
              {posts.length === 0 ? (
                <p>No posts available.</p>
              ) : (
                posts.map((post) => (
                  <div
                    className="card mb-4 shadow-sm"
                    key={post._id}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="card-body"
                      onClick={() => handlePostClick(post._id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{post.title}</h5>
                        <span className="badge bg-primary">
                          {post.category || "Uncategorized"}
                        </span>
                      </div>
                      <p className="text-muted small">
                        by {post.user?.username || "Unknown User"}
                      </p>
                      {post.coverImage && (
                        <img
                          src={`data:image/jpeg;base64,${post.coverImage}`}
                          alt="Post Cover"
                          className="img-fluid mb-3"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                      )}

                      <div className="d-flex justify-content-start align-items-center gap-3 mt-2">
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post._id);
                          }}
                        >
                          👍 {post.likes || 0}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDislike(post._id);
                          }}
                        >
                          👎 {post.dislikes || 0}
                        </button>
                        <span className="text-muted ms-2">
                          💬 {post.commentCount || 0} comments
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "profile" && (
          <>
            <h4>Your Profile</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: "800px" }}>
              {!token ? (
                <div className="alert alert-warning">
                  Please <a href="/login">login</a> to view your profile.
                </div>
              ) : userProfile ? (
                <>
                  <h5>Username: {userProfile.username}</h5>
                  <p>Email: {userProfile.email}</p>
                  <p>Bio: {userProfile.bio || "No bio available"}</p>
                </>
              ) : (
                <p>Loading profile...</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;