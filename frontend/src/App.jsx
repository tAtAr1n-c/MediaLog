import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage/HomePage.jsx";
import AuthPage from "./pages/AuthPage/AuthPage.jsx";
import SimplePage from "./pages/SimplePage/SimplePage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";
import MyReviewsPage from "./pages/MyReviewsPage/MyReviewsPage.jsx";
import PeoplePage from "./pages/PeoplePage/PeoplePage.jsx";
import DiscoveryPage from "./pages/DiscoveryPage/DiscoveryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/reviews"
        element={
          <ProtectedRoute>
            <MyReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/people"
        element={
          <ProtectedRoute>
            <PeoplePage />
          </ProtectedRoute>
        }
      />
      <Route path="/sign-in" element={<AuthPage />} />
      <Route path="/sign-up" element={<AuthPage />} />
      <Route path="/top-rated" element={<DiscoveryPage mode="weekly" />} />
      <Route path="/random-film" element={<DiscoveryPage mode="movie" />} />
      <Route path="/random-book" element={<DiscoveryPage mode="book" />} />
      <Route path="/support" element={<SimplePage title="Поддержка" />} />
    </Routes>
  );
}
