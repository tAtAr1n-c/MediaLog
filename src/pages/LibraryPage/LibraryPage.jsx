import { useState } from "react";
import { Link } from "react-router-dom";
import MainHeader from "../../components/MainHeader.jsx";
import "./LibraryPage.css";

export default function LibraryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="library-page">
      <MainHeader onToggleMenu={() => setMenuOpen(!menuOpen)} />

      {menuOpen && (
        <aside className="library-dropdown">
          <input type="search" placeholder="Search" className="library-search-input" />
          <nav className="library-dropdown-links">
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

      <section className="library-content">
        <h1>Library</h1>
        <p>Здесь будет твоя коллекция фильмов и книг.</p>

        <div className="library-grid">
          <article className="library-card">
            <h2>Movies</h2>
            <p>Добавленные фильмы появятся здесь.</p>
          </article>
          <article className="library-card">
            <h2>Books</h2>
            <p>Добавленные книги появятся здесь.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
