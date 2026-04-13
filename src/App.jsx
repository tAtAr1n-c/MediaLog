import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage.jsx";
import SimplePage from "./pages/SimplePage/SimplePage.jsx";
import ProfilePage from "./pages/ProfilePage/ProfilePage.jsx";
import LibraryPage from "./pages/LibraryPage/LibraryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage title="Profile" text="Страница профиля " />} />
      <Route path="/library" element={<LibraryPage title="Library" text="Страница библиотеки " />} />
      <Route path="/sign-in" element={<SimplePage title="Sign in" text="Страница входа " />} />
      <Route path="/sign-up" element={<SimplePage title="Sign up" text="Страница регистрации " />} />
      <Route path="/top-rated" element={<SimplePage title="Top Rated" />} />
      <Route path="/random-film" element={<SimplePage title="Random Film" />} />
      <Route path="/random-book" element={<SimplePage title="Random Book" />} />
      <Route path="/support" element={<SimplePage title="Support" />} />
    </Routes>
  );
}
