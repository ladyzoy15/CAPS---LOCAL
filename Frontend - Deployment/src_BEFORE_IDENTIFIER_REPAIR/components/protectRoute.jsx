import { Navigate } from "react-router-dom";
import { getToken } from "../utils/authStorage";

/*
 * ProtectedRoute
 *
 * Checks if an authentication token exists.
 * If authenticated, render the requested page.
 * If not authenticated, redirect to the login page.
 *
 * This component does NOT wait for an API request,
 * so it will not stay stuck on a loading state.
 */
const ProtectedRoute = ({ element }) => {
  try {
    const token = getToken();

    // No token = not authenticated
    if (!token) {
      return <Navigate to="/" replace />;
    }

    // Token exists = allow access
    return element;
  } catch (error) {
    console.error("Authentication check failed:", error);

    // If checking the token fails, return to login
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
