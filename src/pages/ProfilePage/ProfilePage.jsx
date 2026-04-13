import { useState } from "react";
import { Link } from "react-router-dom";
import MainHeader from "../../components/MainHeader.jsx";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <main className="profile-page">
      <MainHeader onToggleMenu={() => setMenuOpen(!menuOpen)} />

      {menuOpen && (
        <aside className="profile-dropdown">
          <input type="search" placeholder="Search" className="profile-search-input" />
          <nav className="profile-dropdown-links">
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            <Link to="/top-rated" onClick={() => setMenuOpen(false)}>
              Top Rated
            </Link>
            <Link to="/random-film" onClick={() => setMenuOpen(false)}>
              Random Film
            </Link>
            <Link to="/random-book" onClick={() => setMenuOpen(false)}>
              Random Book
            </Link>
            <Link to="/support" onClick={() => setMenuOpen(false)}>
              Support
            </Link>
            <Link to="/library" onClick={() => setMenuOpen(false)}>
              Library
            </Link>
          </nav>
        </aside>
      )}

      <section className="profile-card">
        <h1>Profile</h1>
        <p>Тут будет информация о твоем аккаунте и активности.</p>

        <ul className="profile-stats">
          <li>
            <span>Фильмов</span>
            <strong>0</strong>
          </li>
          <li>
            <span>Книг</span>
            <strong>0</strong>
          </li>
          <li>
            <span>Рецензий</span>
            <strong>0</strong>
          </li>
        </ul>

        <Link to="/" className="profile-home-link">
          Вернуться на главную
        </Link>
      </section>
    </main>
  );
}
