import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import "./MainHeader.css";

const navigationItems = [
  { to: "/profile", label: "Профиль", description: "Аккаунт и активность" },
  { to: "/people", label: "Люди", description: "Поиск пользователей по нику" },
  { to: "/library", label: "Библиотека", description: "Личная полка с отзывами" },
  { to: "/top-rated", label: "Лучшее", description: "Лучшее за неделю" },
  { to: "/random-film", label: "Случайный фильм", description: "Идея для кино на вечер" },
  { to: "/random-book", label: "Случайная книга", description: "Книга по настроению" },
  { to: "/support", label: "Поддержка", description: "Помощь и контакты" },
];

export default function MainHeader({ showAuthLinks = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMenuOpen(false);
    setQuery("");
  }, [location.pathname]);

  const filteredItems = navigationItems.filter(({ label, description }) => {
    const value = `${label} ${description}`.toLowerCase();
    return value.includes(query.trim().toLowerCase());
  });

  const userLabel = user?.full_name || user?.username || "Профиль";

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <>
      <div className="main-header-shell">
        <header className="main-header">
          <Link to="/" className="main-header-brand">
            <span className="main-header-brand-mark">M</span>
            <span className="main-header-brand-copy">
              <strong>MediaLog</strong>
              <small>книги и фильмы</small>
            </span>
          </Link>

          <div className="main-header-actions">
            {showAuthLinks ? (
              isAuthenticated ? (
                <>
                  <Link to="/profile" className="main-header-signin main-header-user">
                    {userLabel}
                  </Link>
                  <button type="button" className="main-header-signout" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/sign-in" className="main-header-signin">
                    Войти
                  </Link>
                  <Link to="/sign-up" className="main-header-signup">
                    Регистрация
                  </Link>
                </>
              )
            ) : null}

            <button
              type="button"
              className={`main-header-menu-button ${menuOpen ? "is-open" : ""}`}
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="main-header-overlay"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
          />
          <aside className="main-header-drawer">
            <div className="main-header-drawer-top">
              <div>
                <p>Навигация</p>
                <h2>Быстрый доступ</h2>
              </div>

              <button
                type="button"
                className="main-header-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                ×
              </button>
            </div>

            <label className="main-header-search">
              <span>Поиск раздела</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Библиотека, случайный фильм, поддержка..."
              />
            </label>

            <nav className="main-header-nav">
              {filteredItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `main-header-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </NavLink>
              ))}
            </nav>

            {filteredItems.length === 0 ? (
              <p className="main-header-empty">По этому запросу разделов пока нет.</p>
            ) : null}

            <div className="main-header-drawer-footer">
              <span>MediaLog</span>
              <p>Рецензии на книги и фильмы в одной навигации.</p>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
