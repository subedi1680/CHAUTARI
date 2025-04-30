"use client"

import { useEffect } from "react"
import { Link } from "react-router-dom"
import logo from "../assets/logo-removebg.png"
import "./LandingPage.css"

const LandingPage = () => {
  // Check if user is already logged in
  const isLoggedIn = !!sessionStorage.getItem("token")

  // Animation on scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show")
          }
        })
      },
      { threshold: 0.1 },
    )

    const hiddenElements = document.querySelectorAll(".animate-on-scroll")
    hiddenElements.forEach((el) => observer.observe(el))

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 hero-content">
              <div className="animate-on-scroll">
                <img src={logo || "/placeholder.svg"} alt="CHAUTARI" className="hero-logo mb-4" />
                <h1 className="display-4 fw-bold text-white mb-3">
                  Connect, Share, and Engage with <span className="text-highlight">CHAUTARI</span>
                </h1>
                <div className="d-flex flex-wrap gap-3 mt-4">
                  {isLoggedIn ? (
                    <Link to="/home" className="btn btn-light btn-lg rounded-pill px-4 fw-medium">
                      <i className="bi bi-house-door me-2"></i>
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link to="/register" className="btn btn-light btn-lg rounded-pill px-4 fw-medium">
                        <i className="bi bi-person-plus me-2"></i>
                        Sign Up Free
                      </Link>
                      <Link to="/login" className="btn btn-outline-light btn-lg rounded-pill px-4 fw-medium">
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Log In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <div className="typewriter-container animate-on-scroll">
                <p className="tagline-text text-white">
                  Join our vibrant community platform where you can share your thoughts, engage in meaningful
                  discussions, and connect with like-minded individuals.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-shape"></div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container py-5">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="fw-bold">Why Choose CHAUTARI?</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "700px" }}>
              Our platform offers a unique space for sharing ideas, connecting with others, and engaging in meaningful
              conversations across various topics.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll">
                <div className="card-body p-4 text-center">
                  <div className="feature-icon bg-primary bg-opacity-10 text-primary rounded-circle mb-3">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Vibrant Community</h4>
                  <p className="text-muted">
                    Connect with a diverse community of users who share your interests and passions.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll" data-delay="200">
                <div className="card-body p-4 text-center">
                  <div className="feature-icon bg-success bg-opacity-10 text-success rounded-circle mb-3">
                    <i className="bi bi-chat-square-text-fill"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Engaging Discussions</h4>
                  <p className="text-muted">
                    Participate in thoughtful discussions across a wide range of categories and topics.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll" data-delay="400">
                <div className="card-body p-4 text-center">
                  <div className="feature-icon bg-info bg-opacity-10 text-info rounded-circle mb-3">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h4 className="fw-bold mb-3">Safe Environment</h4>
                  <p className="text-muted">Enjoy a respectful and moderated platform where your voice can be heard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section py-5 bg-light">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-5 mb-4 mb-lg-0">
              <div className="animate-on-scroll">
                <h2 className="fw-bold mb-4">Discover Topics That Interest You</h2>
                <p className="text-muted mb-4">
                  CHAUTARI offers a wide range of categories to explore. From technology and arts to lifestyle and
                  education, there's something for everyone.
                </p>
                <Link to="/register" className="btn btn-primary rounded-pill px-4 fw-medium">
                  Explore Categories
                </Link>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="category-cloud animate-on-scroll">
                <span className="category-tag tag-lg">Technology</span>
                <span className="category-tag">Arts & Culture</span>
                <span className="category-tag tag-md">Community Discussions</span>
                <span className="category-tag">Health & Wellness</span>
                <span className="category-tag tag-sm">Education</span>
                <span className="category-tag">Travel & Places</span>
                <span className="category-tag tag-md">Food & Cuisine</span>
                <span className="category-tag tag-sm">Sports & Fitness</span>
                <span className="category-tag">Entertainment</span>
                <span className="category-tag tag-lg">Lifestyle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate-on-scroll">
                <div className="card-body p-5 text-center">
                  <h2 className="fw-bold mb-3">Ready to Join Our Community?</h2>
                  <p className="text-muted mb-4">
                    Create your account today and start connecting with like-minded individuals on CHAUTARI.
                  </p>
                  <div className="d-flex flex-wrap justify-content-center gap-3">
                    {isLoggedIn ? (
                      <Link to="/home" className="btn btn-primary btn-lg rounded-pill px-5 fw-medium">
                        Go to Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/register" className="btn btn-primary btn-lg rounded-pill px-5 fw-medium">
                          Sign Up Now
                        </Link>
                        <Link to="/login" className="btn btn-outline-primary btn-lg rounded-pill px-5 fw-medium">
                          Log In
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
