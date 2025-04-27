import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "../components/UserContext"; // Import the UserContext

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { categorySetupCompleted } = useContext(UserContext); // Use context to check category setup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Invalid username or password");
      }

      const data = await response.json();
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.user.id);

      // After login, check if category setup is completed
      if (data.user.categorySetupCompleted === false) {
        // If category setup is not completed, redirect to category-setup
        navigate("/category-setup");
      } else {
        // If category setup is completed, redirect to home
        navigate("/home");
      }

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-5">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", margin: "auto" }}>
          <h2 className="mb-3">Login</h2>
          {error && <p className="text-danger">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-dark">
                Login
              </button>
            </div>
          </form>
          <div className="mt-3">
            <a href="/register" className="text-decoration-none">
              Don&apos;t have an account? Register
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
