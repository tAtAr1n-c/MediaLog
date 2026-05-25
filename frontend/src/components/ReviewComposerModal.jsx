import { useEffect, useState } from "react";
import { searchMedia } from "../services/apiClient.js";
import "./ReviewComposerModal.css";

const toneCycle = ["iris", "lilac", "plum", "midnight"];

function createInitialState() {
  return {
    type: "film",
    selectedMedia: null,
    rating: 4,
    summary: "",
    body: "",
  };
}

function formatMediaMeta(media) {
  return [media.type === "book" ? "Книга" : "Фильм", media.creator, media.year].filter(Boolean).join(" • ");
}

export default function ReviewComposerModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialState);
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaResults, setMediaResults] = useState([]);
  const [mediaState, setMediaState] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setForm(createInitialState());
      setMediaQuery("");
      setMediaResults([]);
      setMediaState("idle");
      setMessage("");
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    let ignore = false;
    const normalizedQuery = mediaQuery.trim();

    async function runSearch() {
      if (!open || normalizedQuery.length < 2) {
        setMediaResults([]);
        setMediaState("idle");
        return;
      }

      if (form.selectedMedia?.title === normalizedQuery) {
        setMediaResults([]);
        setMediaState("idle");
        return;
      }

      setMediaState("loading");
      setMessage("");

      try {
        const results = await searchMedia(normalizedQuery, form.type);

        if (!ignore) {
          setMediaResults(results);
          setMediaState("idle");
        }
      } catch (error) {
        if (!ignore) {
          setMediaResults([]);
          setMessage(error instanceof Error ? error.message : "Не удалось найти тайтлы.");
          setMediaState("idle");
        }
      }
    }

    const timer = window.setTimeout(runSearch, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [form.selectedMedia, form.type, mediaQuery, open]);

  if (!open) {
    return null;
  }

  const previewTone = toneCycle[form.rating % toneCycle.length];
  const saveDisabled = !form.selectedMedia || !form.body.trim() || !form.summary.trim();

  const handleTypeChange = (type) => {
    setForm((current) => ({ ...current, type, selectedMedia: null }));
    setMediaQuery("");
    setMediaResults([]);
    setMediaState("idle");
    setMessage("");
  };

  const handleSelectMedia = (media) => {
    setForm((current) => ({ ...current, selectedMedia: media, type: media.type }));
    setMediaQuery(media.title);
    setMediaResults([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saveDisabled) {
      return;
    }

    const newReview = {
      id: `review-${Date.now()}`,
      externalId: form.selectedMedia.externalId,
      title: form.selectedMedia.title,
      creator: form.selectedMedia.creator,
      year: form.selectedMedia.year,
      rating: form.rating,
      summary: form.summary.trim(),
      body: form.body.trim(),
      type: form.selectedMedia.type,
      createdAt: new Date().toISOString(),
      tone: form.selectedMedia.tone || previewTone,
      poster: form.selectedMedia.poster,
    };

    setSaving(true);
    setMessage("");

    try {
      await onSubmit(newReview);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить отзыв.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="review-composer-overlay" onClick={onClose} aria-label="Закрыть форму" />

      <section className="review-composer-dialog" aria-modal="true" role="dialog">
        <div className={`review-composer-art review-tone-${previewTone}`}>
          {form.selectedMedia?.poster ? (
            <img className="review-composer-art-image" src={form.selectedMedia.poster} alt="" />
          ) : null}

          <div className="review-composer-art-head">
            <span>{form.selectedMedia?.type === "book" ? "Рецензия на книгу" : "Рецензия на фильм"}</span>
            <strong>Черновик</strong>
          </div>

          <div className="review-composer-art-body">
            <p>{form.selectedMedia?.title || "Выбери тайтл"}</p>
            <small>{form.selectedMedia?.creator || "Поиск идет по OMDB и Google Books"}</small>
          </div>
        </div>

        <form className="review-composer-form" onSubmit={handleSubmit}>
          <div className="review-composer-top">
            <div>
              <p>Редактор</p>
              <h2>Новая рецензия</h2>
            </div>

            <button type="button" className="review-composer-close" onClick={onClose} aria-label="Закрыть форму">
              ×
            </button>
          </div>

          <div className="review-composer-type-switch">
            {[
              { value: "film", label: "Фильм" },
              { value: "book", label: "Книга" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`review-composer-type ${form.type === option.value ? "is-active" : ""}`}
                onClick={() => handleTypeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="review-composer-field">
            <span>Найти фильм или книгу</span>
            <input
              type="search"
              value={mediaQuery}
              onChange={(event) => {
                setMediaQuery(event.target.value);
                setForm((current) => ({ ...current, selectedMedia: null }));
              }}
              placeholder="Начни вводить название"
            />
          </label>

          <div className="review-composer-search-results" aria-live="polite">
            {mediaState === "loading" ? <p>Ищем совпадения...</p> : null}

            {mediaQuery.trim().length >= 2 && mediaState !== "loading" && mediaResults.length === 0 && !form.selectedMedia ? (
              <p>Ничего не найдено. Попробуй другое название.</p>
            ) : null}

            {form.selectedMedia ? (
              <article className="review-composer-selected">
                <strong>{form.selectedMedia.title}</strong>
                <span>{formatMediaMeta(form.selectedMedia)}</span>
              </article>
            ) : null}

            {mediaResults.slice(0, 6).map((media) => (
              <button
                key={media.id}
                type="button"
                className="review-composer-result"
                onClick={() => handleSelectMedia(media)}
              >
                <strong>{media.title}</strong>
                <span>{formatMediaMeta(media)}</span>
              </button>
            ))}
          </div>

          <div className="review-composer-field">
            <span>Оценка</span>
            <div className="review-composer-stars">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`review-composer-star ${value <= form.rating ? "is-filled" : ""}`}
                    onClick={() => setForm((current) => ({ ...current, rating: value }))}
                    aria-label={`Поставить ${value} из 5`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>

          <label className="review-composer-field">
            <span>Короткое описание</span>
            <input
              type="text"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Коротко опиши впечатление"
            />
          </label>

          <label className="review-composer-field">
            <span>Текст</span>
            <textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              placeholder="Напишите свое мнение..."
              rows={8}
            />
          </label>

          <div className="review-composer-actions">
            {message ? <p className="review-composer-message">{message}</p> : null}

            <button type="submit" className="review-composer-submit" disabled={saveDisabled || saving}>
              {saving ? "Сохраняем..." : "Сохранить отзыв"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
