import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import { createLibraryItem, getRandomBook, getRandomMovie, getWeeklyBest } from "../../services/apiClient.js";
import "./DiscoveryPage.css";

const pageContent = {
  weekly: {
    kicker: "Открытый рейтинг",
    title: "Лучшее за неделю",
    description: "Рецензии с самой высокой оценкой за последние семь дней.",
    empty: "За последнюю неделю рецензий пока нет.",
  },
  movie: {
    kicker: "Случайная рекомендация",
    title: "Случайный фильм",
    description: "Подборка берет фильм из открытого каталога.",
    action: "Другой фильм",
  },
  book: {
    kicker: "Случайная рекомендация",
    title: "Случайная книга",
    description: "Подборка берет книгу из открытого каталога.",
    action: "Другая книга",
  },
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatType(type) {
  return type === "book" ? "Книга" : "Фильм";
}

function WeeklyBest({ items, emptyText }) {
  if (!items.length) {
    return <p className="discovery-empty">{emptyText}</p>;
  }

  return (
    <section className="discovery-list" aria-label="Лучшие рецензии недели">
      {items.map((item, index) => (
        <article key={item.id} className="discovery-review-card">
          <div className="discovery-review-rank">{index + 1}</div>
          {item.poster ? (
            <img className="discovery-review-cover" src={item.poster} alt="" />
          ) : (
            <div className="discovery-review-cover discovery-review-cover-placeholder">{formatType(item.type)}</div>
          )}
          <div className="discovery-review-body">
            <div className="discovery-review-topline">
              <span>{formatType(item.type)}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
            <h2>{item.title}</h2>
            <p className="discovery-review-meta">
              {[item.creator, item.year].filter(Boolean).join(" · ") || "Медиа"}
            </p>
            <p className="discovery-review-summary">
              {item.summary || item.body || "Автор оставил оценку без подробного текста."}
            </p>
            {item.authorName || item.authorUsername ? (
              <p className="discovery-review-author">
                Автор: {item.authorName || item.authorUsername}
              </p>
            ) : null}
          </div>
          <strong className="discovery-rating">{item.rating.toFixed(1)}</strong>
        </article>
      ))}
    </section>
  );
}

function RandomMedia({ item, mode, onRefresh, onSave, loading, saving, saveState, saveMessage, isAuthenticated }) {
  if (!item) {
    return null;
  }

  const typeLabel = mode === "book" ? "Книга" : "Фильм";

  return (
    <article className="discovery-random-card">
      {item.poster ? (
        <img className="discovery-poster" src={item.poster} alt="" />
      ) : (
        <div className="discovery-poster discovery-poster-placeholder">{typeLabel}</div>
      )}

      <div className="discovery-random-content">
        <p className="discovery-review-topline">{typeLabel}</p>
        <h2>{item.title}</h2>
        <p className="discovery-review-meta">
          {[item.creator, item.year].filter(Boolean).join(" · ") || typeLabel}
        </p>
        <p className="discovery-random-note">{item.note}</p>
        <div className="discovery-actions">
          <button type="button" className="discovery-refresh" onClick={onRefresh} disabled={loading || saving}>
            {loading ? "Ищем..." : pageContent[mode].action}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              className="discovery-save"
              onClick={onSave}
              disabled={loading || saving || saveState === "saved"}
            >
              {saving ? "Сохраняем..." : saveState === "saved" ? "Сохранено" : "Сохранить"}
            </button>
          ) : (
            <Link className="discovery-save discovery-save-link" to="/sign-in">
              Войти, чтобы сохранить
            </Link>
          )}
        </div>

        {saveMessage ? <p className="discovery-save-message">{saveMessage}</p> : null}
      </div>
    </article>
  );
}

export default function DiscoveryPage({ mode }) {
  const { isAuthenticated, token } = useAuth();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(mode === "weekly" ? [] : null);
  const [saveState, setSaveState] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const content = pageContent[mode];

  const loadContent = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      if (mode === "weekly") {
        setPayload(await getWeeklyBest());
      } else if (mode === "movie") {
        setPayload(await getRandomMovie());
      } else {
        setPayload(await getRandomBook());
      }
      setStatus("success");
      setSaveState("idle");
      setSaveMessage("");
    } catch (requestError) {
      setError(requestError.message || "Не удалось загрузить раздел.");
      setStatus("error");
    }
  }, [mode]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const isLoading = status === "loading";

  const handleSaveRandom = async () => {
    if (!token || !payload || mode === "weekly") {
      return;
    }

    setSaveState("saving");
    setSaveMessage("");

    try {
      await createLibraryItem(token, {
        ...payload,
        status: "Сохранено",
        note: payload.note || `Сохранено из случайной подборки: ${mode === "book" ? "книга" : "фильм"}.`,
      });
      setSaveState("saved");
      setSaveMessage("Добавлено в сохраненные.");
    } catch (requestError) {
      if (requestError?.status === 400) {
        setSaveState("saved");
        setSaveMessage("Этот тайтл уже есть в сохраненных.");
        return;
      }

      setSaveState("idle");
      setSaveMessage(requestError.message || "Не удалось сохранить тайтл.");
    }
  };

  return (
    <main className="discovery-page">
      <MainHeader />

      <section className="discovery-shell">
        <header className="discovery-hero">
          <p className="discovery-kicker">{content.kicker}</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </header>

        {isLoading && mode === "weekly" ? <p className="discovery-state">Загружаем...</p> : null}
        {status === "error" ? <p className="discovery-state is-error">{error}</p> : null}

        {status === "success" && mode === "weekly" ? (
          <WeeklyBest items={payload} emptyText={content.empty} />
        ) : null}

        {mode !== "weekly" ? (
          <RandomMedia
            item={payload}
            mode={mode}
            onRefresh={loadContent}
            onSave={handleSaveRandom}
            loading={isLoading}
            saving={saveState === "saving"}
            saveState={saveState}
            saveMessage={saveMessage}
            isAuthenticated={isAuthenticated}
          />
        ) : null}
      </section>
    </main>
  );
}
