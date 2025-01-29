import 'bootstrap/dist/css/bootstrap.min.css';

function Register() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-4">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", margin: "auto" }}>
          <h2 className="mb-3">Register</h2>
          <form>
            <div className="mb-3 text-start">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" placeholder="Username" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="Email" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-control" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Password" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" placeholder="Confirm Password" required />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-dark">Register</button>
            </div>
          </form>
          <div className="mt-3">
            <a href="/login" className="text-decoration-none">Already have an account? Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
