import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import { deleteReview, getReviews } from "../../services/apiClient.js";
import {
  formatReviewDate,
  getAverageRating,
  getReviewTypeLabel,
  sortReviewsByDate,
} from "../../data/profileMock.js";
import "./MyReviewsPage.css";

const filters = [
  { value: "all", label: "Все" },
  { value: "film", label: "Фильмы" },
  { value: "book", label: "Книги" },
];

export default function MyReviewsPage() {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadUserReviews() {
      setIsLoading(true);
      setMessage("");

      try {
        const nextReviews = await getReviews(user.id);

        if (!ignore) {
          setReviews(nextReviews);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Не удалось загрузить отзывы.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (user?.id) {
      loadUserReviews();
    }

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const displayName = user?.full_name || user?.username || "Пользователь MediaLog";
  const profile = {
    displayName,
    handle: user?.username || "medialog",
  };
  const sortedReviews = sortReviewsByDate(reviews);
  const filteredReviews = sortedReviews.filter((review) => {
    const matchesFilter = filter === "all" || review.type === filter;
    const searchValue = query.trim().toLowerCase();
    const haystack = `${review.title} ${review.creator} ${review.summary}`.toLowerCase();
    const matchesQuery = searchValue === "" || haystack.includes(searchValue);

    return matchesFilter && matchesQuery;
  });

  const averageRating = getAverageRating(sortedReviews);

  const handleDeleteReview = async (review) => {
    setDeletingId(review.backendId);
    setMessage("");

    try {
      await deleteReview(token, review.backendId);
      setReviews((currentReviews) =>
        currentReviews.filter((currentReview) => currentReview.backendId !== review.backendId),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить отзыв.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="my-reviews-page">
      <MainHeader />

      <section className="my-reviews-shell">
        <article className="my-reviews-hero">
          <div>
            <p className="my-reviews-kicker">Архив автора</p>
            <h1>{profile.displayName}</h1>
            <span className="my-reviews-handle">{profile.handle}</span>
            <p className="my-reviews-copy">
              Все фильмы и книги, на которые пользователь уже оставил рецензию. Это отдельный архив отзывов,
              не связанный с библиотекой.
            </p>
          </div>

          <div className="my-reviews-hero-actions">
            <Link to="/profile" className="my-reviews-primary">
              Вернуться в профиль
            </Link>
            <span className="my-reviews-pill">{isLoading ? "..." : sortedReviews.length} отзывов</span>
          </div>
        </article>

        <section className="my-reviews-toolbar">
          <label className="my-reviews-search">
            <span>Поиск</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, автор, режиссёр..."
            />
          </label>

          <div className="my-reviews-filters">
            {filters.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`my-reviews-filter ${filter === option.value ? "is-active" : ""}`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="my-reviews-metrics">
            <article>
              <span>Средняя оценка</span>
              <strong>{averageRating}</strong>
            </article>
            <article>
              <span>Показано</span>
              <strong>{filteredReviews.length}</strong>
            </article>
          </div>
        </section>

        <section className="my-reviews-list">
          {message ? <article className="my-reviews-item my-reviews-message">{message}</article> : null}

          {isLoading ? <article className="my-reviews-item my-reviews-message">Загружаем отзывы...</article> : null}

          {!isLoading && filteredReviews.length === 0 ? (
            <article className="my-reviews-item my-reviews-message">Отзывов по этому запросу пока нет.</article>
          ) : null}

          {filteredReviews.map((review) => (
            <article key={review.id} id={review.id} className="my-reviews-item">
              <div className={`my-reviews-cover review-tone-${review.tone}`}>
                {review.poster ? <img className="my-reviews-cover-image" src={review.poster} alt="" /> : null}
                <span>{getReviewTypeLabel(review.type)}</span>
                {review.year ? <strong>{review.year}</strong> : null}
              </div>

              <div className="my-reviews-body">
                <div className="my-reviews-item-top">
                  <div>
                    <h2>{review.title}</h2>
                    {review.creator ? <p>{review.creator}</p> : null}
                  </div>

                  <div className="my-reviews-badges">
                    <span>{review.rating.toFixed(1)} / 5</span>
                    <span>{formatReviewDate(review.createdAt)}</span>
                    <button
                      type="button"
                      className="my-reviews-delete"
                      onClick={() => handleDeleteReview(review)}
                      disabled={deletingId === review.backendId}
                    >
                      {deletingId === review.backendId ? "Удаляем..." : "Удалить"}
                    </button>
                  </div>
                </div>

                <p className="my-reviews-summary">{review.summary}</p>
                <p className="my-reviews-text">{review.body}</p>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
