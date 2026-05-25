import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import "./HomePage.css";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const cards = [
    { title: "Лучшее", text: "Открытый рейтинг недели", to: "/top-rated" },
    { title: "Случайный фильм", text: "Идея для просмотра", to: "/random-film" },
    { title: "Случайная книга", text: "Идея для чтения", to: "/random-book" },
    { title: "Библиотека", text: "Личная коллекция", to: "/library" },
  ];

  return (
    <main className="home">
      <MainHeader />

      <section className="home-hero">
        <p className="home-kicker">С любовью MediaLog</p>
        <h1>Фильмы и книги в одном месте</h1>
        <p className="home-description">Сервис по поиску контента на вечер</p>
        <div className="home-hero-actions">
          <Link to={isAuthenticated ? "/profile" : "/sign-up"} className="home-cta-primary">
            {isAuthenticated ? "Профиль" : "Начать"}
          </Link>
          <Link to="/support" className="home-cta-secondary">
            Подробнее
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
          <span>Связаться с нами</span>
          <strong>team@medialog.app</strong>
        </a>
      </footer>
    </main>
  );
}
