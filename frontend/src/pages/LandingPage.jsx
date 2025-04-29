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
                <p className="lead text-white-75 mb-4">
                  Join our vibrant community platform where you can share your thoughts, engage in meaningful
                  discussions, and connect with like-minded individuals.
                </p>
                <div className="d-flex flex-wrap gap-3">
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
              <div className="hero-image-container animate-on-scroll">
                <div className="floating-card card1">
                  <div className="card border-0 shadow-lg rounded-4">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-placeholder me-3"></div>
                        <div>
                          <h6 className="mb-0">Just posted a new article!</h6>
                          <small className="text-muted">2 minutes ago</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="floating-card card2">
                  <div className="card border-0 shadow-lg rounded-4">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-hand-thumbs-up-fill text-primary fs-4 me-3"></i>
                        <div>
                          <h6 className="mb-0">15 people liked your post</h6>
                          <small className="text-muted">Today at 3:45 PM</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="floating-card card3">
                  <div className="card border-0 shadow-lg rounded-4">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-chat-left-text-fill text-success fs-4 me-3"></i>
                        <div>
                          <h6 className="mb-0">New comment on your post</h6>
                          <small className="text-muted">Just now</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                  education, there&apos;s something for everyone.
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

      {/* How It Works Section */}
      <section className="how-it-works-section py-5">
        <div className="container py-5">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="fw-bold">How CHAUTARI Works</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "700px" }}>
              Getting started with CHAUTARI is easy. Follow these simple steps to begin your journey.
            </p>
          </div>

          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="steps-container">
                <div className="step-item animate-on-scroll">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4 className="fw-bold">Create Your Account</h4>
                    <p className="text-muted">
                      Sign up for a free account to join our community. It only takes a minute!
                    </p>
                  </div>
                </div>

                <div className="step-item animate-on-scroll" data-delay="200">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4 className="fw-bold">Select Your Interests</h4>
                    <p className="text-muted">
                      Choose categories that interest you to personalize your feed and discover relevant content.
                    </p>
                  </div>
                </div>

                <div className="step-item animate-on-scroll" data-delay="400">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4 className="fw-bold">Connect & Engage</h4>
                    <p className="text-muted">
                      Start posting, commenting, and connecting with other members of the community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="fw-bold">What Our Users Say</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "700px" }}>
              Don&apos;t just take our word for it. Here&apos;s what members of our community have to say about CHAUTARI.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder">S</div>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Sarah K.</h5>
                      <p className="text-muted small mb-0">Technology Enthusiast</p>
                    </div>
                  </div>
                  <div className="testimonial-rating text-warning mb-3">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <p className="testimonial-text">
                    &quot;CHAUTARI has become my go-to platform for discussing tech trends. The community is knowledgeable
                    and always willing to help. I&apos;ve learned so much since joining!&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll" data-delay="200">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder">R</div>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Raj M.</h5>
                      <p className="text-muted small mb-0">Food Blogger</p>
                    </div>
                  </div>
                  <div className="testimonial-rating text-warning mb-3">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-half"></i>
                  </div>
                  <p className="testimonial-text">
                    &quot;I love sharing my recipes and food adventures on CHAUTARI. The feedback I get is invaluable, and
                    I&apos;ve connected with so many fellow food enthusiasts!&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 animate-on-scroll" data-delay="400">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder">A</div>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Anita P.</h5>
                      <p className="text-muted small mb-0">Student</p>
                    </div>
                  </div>
                  <div className="testimonial-rating text-warning mb-3">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <p className="testimonial-text">
                    &quot;As a student, CHAUTARI has been an amazing resource for academic discussions. I&apos;ve found study
                    partners and mentors who have helped me excel in my courses.&quot;
                  </p>
                </div>
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

      {/* Footer */}
      <footer className="footer-section py-4 bg-dark text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <img src={logo || "/placeholder.svg"} alt="CHAUTARI" className="footer-logo me-2" />
              <span className="ms-2">© 2023 CHAUTARI. All rights reserved.</span>
            </div>
            <div className="col-md-6">
              <ul className="list-inline mb-0 text-center text-md-end">
                <li className="list-inline-item">
                  <a href="#" className="text-white text-decoration-none">
                    Terms
                  </a>
                </li>
                <li className="list-inline-item ms-3">
                  <a href="#" className="text-white text-decoration-none">
                    Privacy
                  </a>
                </li>
                <li className="list-inline-item ms-3">
                  <a href="#" className="text-white text-decoration-none">
                    Help
                  </a>
                </li>
                <li className="list-inline-item ms-3">
                  <a href="#" className="text-white text-decoration-none">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
