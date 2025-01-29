import 'bootstrap/dist/css/bootstrap.min.css';

function CreateNewPost() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="container text-center">
        <h1 className="mb-4">CHAUTARI</h1>
        <div className="card p-4 shadow-lg" style={{ maxWidth: "600px", margin: "auto" }}>
          <h2 className="mb-3">Create New Post</h2>
          <form>
            <div className="mb-3 text-start">
              <label className="form-label">Title</label>
              <input type="text" className="form-control" placeholder="Enter title" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Category</label>
              <input type="text" className="form-control" placeholder="Enter category" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Cover Image</label>
              <input type="file" className="form-control" required />
            </div>
            <div className="mb-3 text-start">
              <label className="form-label">Content</label>
              <textarea className="form-control" placeholder="Write your content here" rows="5" required></textarea>
            </div>
            <div className="d-flex justify-content-between mt-3">
              <button type="button" className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-dark">Publish</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateNewPost;