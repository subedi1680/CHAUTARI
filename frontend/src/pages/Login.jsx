import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-5">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", margin: "auto" }}>
          <h2 className="mb-3">Login</h2>
          <form>
            <div className="mb-3 text-start">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" placeholder="Username" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Password" required />
            </div>
            <div className="text-end">
              <a href="/forgot" className="text-decoration-none">Forgot Password?</a>
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-dark">Login</button>
            </div>
          </form>
          <div className="mt-3">
            <a href="/register" className="text-decoration-none">Don&apos;t have an account? Register</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
