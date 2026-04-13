import { useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const cards = [
    { title: "Top Rated", text: "Лучшее за неделю", to: "/top-rated" },
    { title: "Random Film", text: "Случайный фильм", to: "/random-film" },
    { title: "Random Book", text: "Случайная книга", to: "/random-book" },
    { title: "Library", text: "Личная коллекция", to: "/library" },
  ];

  return (
    <main className="home">
      <header className="home-header">
        <Link to="/" className="home-brand">
          <span className="home-brand-mark">M</span>
          <span>MediaLog</span>
        </Link>

        <div className="home-header-actions">
          <Link to="/sign-in" className="home-signin-link">
            Sign in
          </Link>
          <Link to="/sign-up" className="home-signup-link">
            Sign up
          </Link>
          <button
            type="button"
            className={`home-menu-trigger ${menuOpen ? "is-open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="home-hero">
        <p className="home-kicker">С любовью MediaLog</p>
        <h1>Фильмы и книги в одном месте</h1>
        <p>Сервис по поиску контента на вечер</p>
        <div className="home-hero-actions">
          <Link to="/sign-up" className="home-cta-primary">
            Start
          </Link>
          <Link to="/support" className="home-cta-secondary">
            Learn more
          </Link>
        </div>
      </section>

      <section className="home-grid">
        {cards.map((card) => (
          <Link key={card.title} to={card.to} className="home-tile">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </Link>
        ))}
      </section>

      <footer className="home-footer">
        <div>
          <h2>MediaLog</h2>
          <p>Служба поддержки отвечает 24/7</p>
        </div>
        <a className="home-contact" href="mailto:team@medialog.app">
          <span>Contact us</span>
          <strong>team@medialog.app</strong>
        </a>
      </footer>

      {menuOpen && (
        <>
          <button type="button" className="home-overlay" onClick={closeMenu} aria-label="Закрыть меню" />
          <aside className="home-menu">
            <div className="home-menu-top">
              <input type="search" placeholder="Search section" />
              <button type="button" className="home-menu-close" onClick={closeMenu} aria-label="Закрыть меню">
                ×
              </button>
            </div>

            <nav className="home-menu-links">
              <Link to="/profile" onClick={closeMenu}>
                Profile
              </Link>
              <Link to="/top-rated" onClick={closeMenu}>
                Top Rated
              </Link>
              <Link to="/random-film" onClick={closeMenu}>
                Random Film
              </Link>
              <Link to="/random-book" onClick={closeMenu}>
                Random Book
              </Link>
              <Link to="/support" onClick={closeMenu}>
                Support
              </Link>
              <Link to="/library" onClick={closeMenu}>
                Library
              </Link>
            </nav>
          </aside>
        </>
      )}
    </main>
  );
}
