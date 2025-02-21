// eslint-disable-next-line no-unused-vars
import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;

  const isLoginPage = ["/", "/login"].includes(path);
  const isRegisterPage = path === "/register";
  const isHomePage = ["/home", "/create-post", "/user-settings"].includes(path);
  const isUserSettingsPage = path === "/user-settings";
  // eslint-disable-next-line no-unused-vars
  const isForgotPassword = path === "/forgot-password";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-dark" to="/">
          CHAUTARI
        </Link>

        {!isLoginPage && !isRegisterPage && (
          <form className="d-flex mx-auto" style={{ width: "40%" }}>
            <input className="form-control me-2" type="search" placeholder="Search" />
          </form>
        )}

        <div>
          {isUserSettingsPage ? (
            <Link to="/home" className="btn btn-outline-primary">Home</Link>
          ) : isHomePage ? (
            <>
              <Link to="/notifications" className="btn btn-outline-primary me-2">Notifications</Link>
              <Link to="/user-settings" className="btn btn-outline-secondary">User Settings</Link>
            </>
          ) : isLoginPage ? (
            <Link to="/register" className="btn btn-outline-secondary">Sign Up</Link>
          ) : isRegisterPage ? (
            <Link to="/login" className="btn btn-outline-primary">Login</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
              <Link to="/register" className="btn btn-outline-secondary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;