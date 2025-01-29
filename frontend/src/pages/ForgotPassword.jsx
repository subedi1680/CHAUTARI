// OTP field and change password needed


import 'bootstrap/dist/css/bootstrap.min.css';

function ForgotPassword() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-4">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", margin: "auto" }}>
          <h2 className="mb-3">Forgot Password</h2>
          <p className="text-muted">Enter your email to reset your password.</p>
          <form>
            <div className="mb-3 text-start">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="Enter your email" required />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-dark">Reset Password</button>
            </div>
          </form>
          <div className="mt-3">
            <a href="/login" className="text-decoration-none">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
