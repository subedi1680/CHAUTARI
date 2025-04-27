import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./components/UserContext"; // Import UserProvider
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
import CategorySetup from "./pages/CategorySetup";

function App() {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/user-settings" element={<UserSettings />} />
            <Route path="/post/:postId" element={<PostDetails />} />
            <Route path="/edit-post/:postId" element={<EditPost />} />
          </Route>

          {/* Route for Category Setup */}
          <Route path="/category-setup" element={<CategorySetup />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
