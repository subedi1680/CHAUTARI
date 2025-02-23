import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/posts");
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
  }, []);

  const handlePostClick = (postId) => {
    if (!postId || postId === "undefined") {
      console.error("Invalid postId:", postId);
      return;
    }
    navigate(`/post/${postId}`);
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
                    key={post._id || Math.random()}
                    style={{ cursor: "pointer" }}
                    onClick={() => handlePostClick(post._id)}
                  >
                    <div className="card-body">
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
              <h5>Username: </h5>
              <p>Email: </p>
              <p>Bio: </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
