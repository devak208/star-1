import { Navigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full border-gray-500 animate-spin"></div>
      </div>
    );

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}
