// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem("token")
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!sessionStorage.getItem("token"));
    };

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const path = location.pathname;
  const isLoginPage = ["/", "/login"].includes(path);
  const isRegisterPage = path === "/register";
  const isForgotPasswordPage = path === "/forgot-password";
  const isCreatePostPage = path === "/create-post";
  const isPostDetailsPage = path.startsWith("/post/");
  const isHomePage =
    ["/home", "/create-post", "/user-settings"].includes(path) ||
    isPostDetailsPage;
  const isUserSettingsPage = path === "/user-settings";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-dark" to="/home">
          CHAUTARI
        </Link>

        {isAuthenticated &&
          !isLoginPage &&
          !isRegisterPage &&
          !isForgotPasswordPage && (
            <form className="d-flex mx-auto" style={{ width: "40%" }}>
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search"
              />
            </form>
          )}

        <div>
          {isUserSettingsPage ? (
            <Link to="/home" className="btn btn-outline-primary">
              Home
            </Link>
          ) : isHomePage && isAuthenticated ? (
            <>
              {!isCreatePostPage && (
                <Link
                  to="/create-post"
                  className="btn btn-outline-primary me-2"
                >
                  Create Post
                </Link>
              )}
              {isCreatePostPage && (
                <Link to="/home" className="btn btn-outline-primary me-2">
                  Home
                </Link>
              )}
              <Link
                to="/notifications"
                className="btn btn-outline-primary me-2"
              >
                Notifications
              </Link>
              <Link to="/user-settings" className="btn btn-outline-secondary">
                User Settings
              </Link>
            </>
          ) : null}

          {!isAuthenticated &&
          (isLoginPage || isRegisterPage || isForgotPasswordPage) ? (
            isLoginPage ? (
              <Link to="/register" className="btn btn-outline-secondary">
                Sign Up
              </Link>
            ) : isRegisterPage ? (
              <Link to="/login" className="btn btn-outline-primary">
                Login
              </Link>
            ) : null
          ) : null}

          {isAuthenticated && (
            <button
              className="btn btn-outline-danger ms-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
