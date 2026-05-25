import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import ReviewComposerModal from "../../components/ReviewComposerModal.jsx";
import { createReview, deleteReview, getLibraryItems, getReviews } from "../../services/apiClient.js";
import {
  formatReviewDate,
  getAverageRating,
  getReviewTypeLabel,
  sortReviewsByDate,
} from "../../data/profileMock.js";
import "./ProfilePage.css";

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={`${rating}-${index}`} className={index < rating ? "is-filled" : ""}>
      ★
    </span>
  ));
}

function formatMemberSince(value) {
  if (!value) {
    return "—";
  }

  return formatReviewDate(value);
}

function formatItemMeta(...values) {
  return values.filter(Boolean).join(" • ");
}

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
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

  useEffect(() => {
    let ignore = false;

    async function loadSavedItems() {
      setIsLoadingSaved(true);
      setMessage("");

      try {
        const items = await getLibraryItems(token);

        if (!ignore) {
          setSavedItems(items);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Не удалось загрузить сохраненные элементы.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingSaved(false);
        }
      }
    }

    if (token) {
      loadSavedItems();
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const displayName = user?.full_name || user?.username || "Пользователь MediaLog";
  const profile = {
    displayName,
    handle: user?.username || "medialog",
    avatarLabel: displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    bio: "Личная медиаполка, отзывы и сохраненные книги и фильмы.",
    memberSince: formatMemberSince(user?.created_at),
  };

  const sortedReviews = sortReviewsByDate(reviews);
  const reviewPreview = sortedReviews.slice(0, 3);
  const averageRating = getAverageRating(reviews);
  const reviewCount = reviews.length;

  const handleSaveReview = async (newReview) => {
    const savedReview = await createReview(token, newReview);
    setReviews((current) => [savedReview, ...current]);
  };

  const handleDeleteReview = async (review) => {
    setDeletingId(review.backendId);
    setMessage("");

    try {
      await deleteReview(token, review.backendId);
      setReviews((current) => current.filter((currentReview) => currentReview.backendId !== review.backendId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить отзыв.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="profile-page">
      <MainHeader />

      <section className="profile-shell">
        <aside className="profile-sidebar">
          <article className="profile-identity-card">
            <div className="profile-avatar-shell">
              <div className="profile-avatar">{profile.avatarLabel}</div>
            </div>

            <div className="profile-copy-block">
              <p className="profile-kicker">Профиль автора</p>
              <h1>{profile.displayName}</h1>
              <span className="profile-handle">{profile.handle}</span>
              <p className="profile-copy">{profile.bio}</p>
            </div>

            <div className="profile-metrics">
              <article>
                <span>Средняя оценка</span>
                <strong>{isLoading ? "..." : averageRating}</strong>
              </article>
              <article>
                <span>Отзывов</span>
                <strong>{isLoading ? "..." : reviewCount}</strong>
              </article>
              <article>
                <span>С нами с</span>
                <strong>{profile.memberSince}</strong>
              </article>
            </div>
          </article>
        </aside>

        <div className="profile-content">
          {message ? <article className="profile-panel profile-message">{message}</article> : null}

          <article className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <p>Рецензии</p>
                <h2>Рецензии</h2>
              </div>

              <div className="profile-panel-actions">
                <Link to="/profile/reviews" className="profile-panel-link">
                  Открыть все
                </Link>
                <button type="button" className="profile-panel-button" onClick={() => setComposerOpen(true)}>
                  Новый отзыв
                </button>
              </div>
            </div>

            <div className="profile-favorites-grid">
              {!isLoading && reviewPreview.length === 0 ? (
                <p className="profile-empty">Пока нет рецензий. Создай первый отзыв.</p>
              ) : null}

              {reviewPreview.map((review) => (
                <article key={review.id} className="profile-favorite-card">
                  <div className={`profile-favorite-cover review-tone-${review.tone}`}>
                    {review.poster ? <img className="profile-cover-image" src={review.poster} alt="" /> : null}
                    {review.year ? <span>{review.year}</span> : <span>{getReviewTypeLabel(review.type)}</span>}
                    <strong>{getReviewTypeLabel(review.type)}</strong>
                  </div>

                  <div className="profile-favorite-body">
                    <div>
                      <h3>{review.title}</h3>
                      {review.creator ? <p>{review.creator}</p> : null}
                    </div>

                    <div className="profile-rating-row">{renderStars(review.rating)}</div>
                    <p className="profile-favorite-summary">{review.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="profile-panel">
            <div className="profile-panel-head">
              <div>
                <p>Личная полка</p>
                <h2>Сохраненные</h2>
              </div>

              <Link to="/library" className="profile-panel-button">
                Открыть библиотеку
              </Link>
            </div>

            <ul className="profile-review-list">
              {isLoadingSaved ? <li className="profile-empty">Загружаем сохраненные элементы...</li> : null}

              {!isLoadingSaved && savedItems.length === 0 ? (
                <li className="profile-empty">Сохраненных фильмов и книг пока нет.</li>
              ) : null}

              {savedItems.slice(0, 5).map((item) => (
                <li key={item.id} className="profile-review-item profile-saved-item">
                  <div className={`profile-review-thumb review-tone-${item.tone}`}>
                    {item.poster ? <img className="profile-cover-image" src={item.poster} alt="" /> : null}
                    <span>{getReviewTypeLabel(item.type)}</span>
                  </div>

                  <div className="profile-review-body">
                    <div className="profile-review-top">
                      <div>
                        <strong>{item.title}</strong>
                        {formatItemMeta(item.creator, item.year) ? <p>{formatItemMeta(item.creator, item.year)}</p> : null}
                      </div>

                      {item.status ? <span className="profile-review-date">{item.status}</span> : null}
                    </div>

                    <p>{item.note}</p>
                  </div>

                  <div className="profile-review-actions">
                    <Link to="/library" className="profile-card-link profile-card-link-inline">
                      В библиотеку
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <ReviewComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleSaveReview}
      />
    </main>
  );
}
