import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePost from "./pages/CreatePost";
import UserSettings from "./pages/UserSettings";
import ForgotPassword from "./pages/ForgotPassword";
import Header from "./components/Header";
import PostDetails from "./pages/PostDetails";
import EditPost from "./pages/EditPost";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/user-settings" element={<UserSettings />} />
          <Route path="/post/:postId" element={<PostDetails />} />
          <Route path="/edit-post/:postId" element={<EditPost />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
