import { Navigate } from "react-router-dom";
import { getToken } from "../utils/authStorage";

/*
 * StudentRoute
 *
 * Checks if the user is authenticated AND has a student role (role_id === 1).
 * If not authenticated, redirects to login.
 * If authenticated but not a student, redirects to login.
 */
const StudentRoute = ({ element }) => {
  try {
    const token = getToken();

    if (!token) {
      return <Navigate to="/" replace />;
    }

    const userJson = sessionStorage.getItem("user");
    if (!userJson) {
      return <Navigate to="/" replace />;
    }

    const user = JSON.parse(userJson);
    const roleId = user.roleID ?? user.roleId;

    if (Number(roleId) !== 1) {
      return <Navigate to="/" replace />;
    }

    return element;
  } catch (error) {
    console.error("Student route check failed:", error);
    return <Navigate to="/" replace />;
  }
};

export default StudentRoute;
