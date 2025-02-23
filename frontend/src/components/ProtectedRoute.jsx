import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem("token")
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!sessionStorage.getItem("token"));
    };

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
