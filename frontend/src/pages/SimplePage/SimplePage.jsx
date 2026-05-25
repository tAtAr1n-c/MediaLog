import { Link } from "react-router-dom";
import MainHeader from "../../components/MainHeader.jsx";
import "./SimplePage.css";

export default function SimplePage({ title, text = "" }) {
  const isAuthPage = title === "Вход" || title === "Регистрация";
  const isSupportPage = title === "Поддержка";
  const supportText =
    "Если у вас возникли вопросы, предложения или проблемы с MediaLog, вы можете связаться с нами в Telegram.";

  return (
    <main className="simple-page">
      <MainHeader showAuthLinks={!isAuthPage} />

      <section className="simple-page-shell">
        <article className="simple-page-panel">
          <p className="simple-page-kicker">{isSupportPage ? "Связь с нами" : "Раздел MediaLog"}</p>
          <h1>{title}</h1>
          <p className="simple-page-copy">
            {isSupportPage ? supportText : text || "Этот раздел скоро будет дополнен."}
          </p>

          {isSupportPage ? (
            <div className="simple-page-actions">
              <a className="simple-page-primary" href="https://t.me/MediaLogSupport" target="_blank" rel="noreferrer">
                Написать в Telegram
              </a>
              <span className="simple-page-contact">@MediaLogSupport</span>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
