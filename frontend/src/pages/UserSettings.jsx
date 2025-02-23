import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";

function UserSettings() {
  const [avatar, setAvatar] = useState(
    "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png"
  );
  const [name, setName] = useState("");
  const [email] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activeTab, setActiveTab] = useState("profile");

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div className="p-3 border-end bg-light" style={{ width: "250px" }}>
        <h5 className="fw-bold">User Settings</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${activeTab === "other" ? "active" : ""}`}
              onClick={() => setActiveTab("other")}
            >
              Other Settings
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        {/* Profile Settings Section */}
        {activeTab === "profile" && (
          <>
            <h4>Profile Settings</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: "600px" }}>
              {/* Avatar Section */}
              <div className="text-center">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="rounded-circle mb-2"
                  style={{ width: "80px", height: "80px" }}
                />
                <br />
                <label className="btn btn-dark btn-sm">
                  Change Avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className="text-muted small mt-1">
                  Recommended: Square image, at least 400x400px
                </p>
              </div>

              {/* Profile Form */}
              <form>
                <div className="mb-3">
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-dark">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {activeTab === "other" && (
          <>
            <h4>Other Settings</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: "600px" }}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={handleCurrentPasswordChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                />
              </div>

              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-dark">
                  Save Changes
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserSettings;
