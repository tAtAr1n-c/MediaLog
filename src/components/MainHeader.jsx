import { Link } from "react-router-dom";
import "./MainHeader.css";

export default function MainHeader({ onToggleMenu, menuOpen = false }) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className={`menu-button ${menuOpen ? "menu-button-open" : ""}`}
          onClick={onToggleMenu}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <Link to="/" className="logo">
          MediaLog
        </Link>
      </div>

      <div className="header-right">
        <Link to="/sign-in" className="signin-link">
          Sign in
        </Link>
        <Link to="/sign-up" className="signup-link">
          Sign up
        </Link>
      </div>
    </header>
  );
}
