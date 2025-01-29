// eslint-disable-next-line no-unused-vars
import React from "react";

const Header = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container-fluid">
        {/* Logo */}
        <a className="navbar-brand fw-bold text-dark" href="/">
          CHAUTARI
        </a>

        {/* Search Bar */}
        <form className="d-flex mx-auto" style={{ width: "40%" }}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
          <button className="btn btn-outline-dark" type="submit">
            Search
          </button>
        </form>

        {/* Navigation Links */}
        <div className="d-flex">
          <a href="/login" className="btn btn-outline-dark me-2">
            Login
          </a>
          <a href="/signup" className="btn btn-dark">
            Sign Up
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Header;
