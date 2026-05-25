import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import { getReviews, searchUsers } from "../../services/apiClient.js";
import { formatReviewDate, getAverageRating, getReviewTypeLabel, sortReviewsByDate } from "../../data/profileMock.js";
import "./PeoplePage.css";

function createUserLabel(user) {
  return user.full_name || user.username;
}

export default function PeoplePage() {
  const { token, user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [searchState, setSearchState] = useState("idle");
  const [reviewsState, setReviewsState] = useState("idle");
  const [message, setMessage] = useState("");

  const normalizedQuery = query.trim();

  useEffect(() => {
    let ignore = false;

    async function runSearch() {
      if (normalizedQuery.length < 2) {
        setUsers([]);
        setSearchState("idle");
        return;
      }

      setSearchState("loading");
      setMessage("");

      try {
        const foundUsers = await searchUsers(token, normalizedQuery);

        if (!ignore) {
          setUsers(foundUsers.filter((foundUser) => foundUser.id !== currentUser?.id));
          setSearchState("idle");
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Не удалось найти пользователей.");
          setSearchState("idle");
        }
      }
    }

    const searchTimer = window.setTimeout(runSearch, 250);

    return () => {
      ignore = true;
      window.clearTimeout(searchTimer);
    };
  }, [currentUser?.id, normalizedQuery, token]);

  const sortedReviews = useMemo(() => sortReviewsByDate(reviews), [reviews]);
  const averageRating = getAverageRating(sortedReviews);

  const handleSelectUser = async (nextUser) => {
    setSelectedUser(nextUser);
    setReviews([]);
    setReviewsState("loading");
    setMessage("");

    try {
      const nextReviews = await getReviews(nextUser.id);
      setReviews(nextReviews);
      setReviewsState("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить отзывы пользователя.");
      setReviewsState("idle");
    }
  };

  return (
    <main className="people-page">
      <MainHeader />

      <section className="people-shell">
        <article className="people-hero">
          <div>
            <p className="people-kicker">Поиск сообщества</p>
            <h1>Люди</h1>
            <p className="people-copy">Ищи других пользователей по нику или имени и смотри их открытые рецензии.</p>
          </div>
          <Link to="/profile" className="people-profile-link">
            Мой профиль
          </Link>
        </article>

        <section className="people-search-panel">
          <label className="people-search">
            <span>Ник пользователя</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Например ivan или @ivan"
            />
          </label>

          <div className="people-search-state" aria-live="polite">
            {searchState === "loading"
              ? "Ищем..."
              : normalizedQuery.length < 2
                ? "Введите минимум 2 символа"
                : `Найдено: ${users.length}`}
          </div>
        </section>

        {message ? <section className="people-message">{message}</section> : null}

        <section className="people-layout">
          <div className="people-results">
            {users.map((foundUser) => (
              <button
                key={foundUser.id}
                type="button"
                className={`people-user-card ${selectedUser?.id === foundUser.id ? "is-active" : ""}`}
                onClick={() => handleSelectUser(foundUser)}
              >
                <span className="people-avatar">{createUserLabel(foundUser).slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{createUserLabel(foundUser)}</strong>
                  <small>{foundUser.username}</small>
                </span>
              </button>
            ))}

            {normalizedQuery.length >= 2 && searchState !== "loading" && users.length === 0 ? (
              <div className="people-empty">Пользователей по такому запросу нет.</div>
            ) : null}
          </div>

          <article className="people-preview">
            {selectedUser ? (
              <>
                <div className="people-preview-head">
                  <div>
                    <p>Открытые рецензии</p>
                    <h2>{createUserLabel(selectedUser)}</h2>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="people-metrics">
                    <article>
                      <span>Отзывы</span>
                      <strong>{reviewsState === "loading" ? "..." : sortedReviews.length}</strong>
                    </article>
                    <article>
                      <span>Средняя</span>
                      <strong>{reviewsState === "loading" ? "..." : averageRating}</strong>
                    </article>
                  </div>
                </div>

                <div className="people-review-list">
                  {reviewsState === "loading" ? <p className="people-empty">Загружаем отзывы...</p> : null}

                  {reviewsState !== "loading" && sortedReviews.length === 0 ? (
                    <p className="people-empty">У пользователя пока нет рецензий.</p>
                  ) : null}

                  {sortedReviews.slice(0, 5).map((review) => (
                    <article key={review.id} className="people-review-item">
                      <div className={`people-review-cover review-tone-${review.tone}`}>
                        {review.poster ? <img className="people-review-cover-image" src={review.poster} alt="" /> : null}
                        <span>{getReviewTypeLabel(review.type)}</span>
                      </div>
                      <div>
                        <h3>{review.title}</h3>
                        <p>{review.summary || review.body || "Без описания."}</p>
                        <small>
                          {review.rating.toFixed(1)} / 5 • {formatReviewDate(review.createdAt)}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="people-empty people-preview-empty">
                Выбери пользователя из результатов, чтобы увидеть его рецензии.
              </div>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}
