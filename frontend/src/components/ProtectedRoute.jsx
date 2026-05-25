import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, status } = useAuth();

  if (status === "checking") {
    return (
      <main className="app-state-page">
        <section className="app-state-panel">Проверяем сессию...</section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return children;
}
