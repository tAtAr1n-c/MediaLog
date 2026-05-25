const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const toneCycle = ["iris", "lilac", "plum", "midnight"];

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg || item.message).filter(Boolean).join(", ") || fallback;
  }

  return fallback;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function request(path, { token, headers, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, response.statusText), response.status, payload);
  }

  return payload;
}

function toBackendMediaType(type) {
  return type === "book" ? "book" : "movie";
}

function toFrontendType(mediaType) {
  return mediaType === "book" ? "book" : "film";
}

function pickTone(seed) {
  return toneCycle[Math.abs(Number(seed) || 0) % toneCycle.length];
}

function formatMovieType(type) {
  if (type === "series") {
    return "Сериал";
  }

  if (type === "movie") {
    return "Фильм";
  }

  return type || "Фильм";
}

function cleanOptional(value) {
  const normalizedValue = String(value || "").trim();
  return normalizedValue && normalizedValue !== "N/A" && normalizedValue !== "Неизвестно" ? normalizedValue : "";
}

function createExternalId(prefix, value) {
  const normalizedValue = String(value || "item")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}-${normalizedValue || Date.now()}-${Date.now()}`;
}

export function getCurrentUser(token) {
  return request("/users/me", { token });
}

function normalizeMovieSearchResult(movie) {
  const source = String(movie.imdbID || "").startsWith("wikidata-")
    ? "Найдено в Wikidata."
    : String(movie.imdbID || "").startsWith("itunes-")
      ? "Найдено в iTunes."
      : "Найдено в OMDB.";

  return {
    id: `film-${movie.imdbID}`,
    externalId: movie.imdbID,
    title: movie.Title,
    creator: formatMovieType(movie.Type),
    year: cleanOptional(movie.Year),
    type: "film",
    rating: 0,
    genre: formatMovieType(movie.Type),
    status: "Каталог",
    tone: pickTone(movie.imdbID?.replace(/\D/g, "")),
    note: source,
    poster: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "",
  };
}

function normalizeBookSearchResult(book) {
  const source = String(book.id || "").startsWith("openlibrary-")
    ? "Найдено в Open Library."
    : "Найдено в Google Books.";

  return {
    id: `book-${book.id}`,
    externalId: book.id,
    title: book.title,
    creator: Array.isArray(book.authors) && book.authors.length ? book.authors.join(", ") : "",
    year: cleanOptional(book.published_date),
    type: "book",
    rating: 0,
    genre: "Книга",
    status: "Каталог",
    tone: pickTone(book.id?.length),
    note: book.description || source,
    poster: book.thumbnail || "",
  };
}

export async function searchMovies(query) {
  const params = new URLSearchParams({ query });
  return request(`/media/movies/search?${params.toString()}`).then((movies) =>
    movies.map(normalizeMovieSearchResult),
  );
}

export async function searchBooks(query) {
  const params = new URLSearchParams({ query, max_results: "20" });
  return request(`/media/books/search?${params.toString()}`).then((books) => books.map(normalizeBookSearchResult));
}

export async function searchMedia(query, type = "all") {
  if (type === "film") {
    return searchMovies(query);
  }

  if (type === "book") {
    return searchBooks(query);
  }

  const [movies, books] = await Promise.allSettled([searchMovies(query), searchBooks(query)]);
  return [
    ...(movies.status === "fulfilled" ? movies.value : []),
    ...(books.status === "fulfilled" ? books.value : []),
  ];
}

export function getWeeklyBest() {
  return request("/discover/weekly-best").then((reviews) => reviews.map(normalizeReview));
}

export function getRandomMovie() {
  return request("/discover/random-movie").then(normalizeMovieSearchResult);
}

export function getRandomBook() {
  return request("/discover/random-book").then(normalizeBookSearchResult);
}

export function searchUsers(token, query) {
  const params = new URLSearchParams({ q: query, limit: "20" });
  return request(`/users/search?${params.toString()}`, { token });
}

export function getReviews(userId) {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return request(`/reviews/${params}`).then((reviews) => reviews.map(normalizeReview));
}

export function createReview(token, review) {
  const payload = {
    external_id: review.externalId || createExternalId("review", review.title),
    media_type: toBackendMediaType(review.type),
    title: review.title,
    creator: review.creator,
    year: review.year,
    rating: Number(review.rating),
    summary: review.summary,
    body: review.body,
    comment: review.body,
    tone: review.tone,
    poster: review.poster,
  };

  return request("/reviews/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(normalizeReview);
}

export function deleteReview(token, reviewId) {
  return request(`/reviews/${reviewId}`, {
    method: "DELETE",
    token,
  });
}

export function getLibraryItems(token) {
  return request("/user-content/", { token }).then((items) => items.map(normalizeLibraryItem));
}

export function createLibraryItem(token, item) {
  const payload = {
    external_id: item.externalId || createExternalId("library", item.title),
    media_type: toBackendMediaType(item.type),
    title: item.title,
    creator: item.creator,
    year: item.year,
    rating: item.rating ? Number(item.rating) : null,
    genre: item.genre,
    status: item.status || "Сохранено",
    note: item.note,
    tone: item.tone,
    poster: item.poster,
  };

  return request("/user-content/", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(normalizeLibraryItem);
}

export function deleteLibraryItem(token, itemId) {
  return request(`/user-content/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export function normalizeReview(review) {
  const createdAt = review.created_at || review.createdAt || new Date().toISOString();

  return {
    id: `review-${review.id}`,
    backendId: review.id,
    externalId: review.external_id,
    title: review.title,
    creator: cleanOptional(review.creator),
    type: toFrontendType(review.media_type || review.type),
    rating: Number(review.rating) || 0,
    year: cleanOptional(review.year),
    summary: review.summary || review.comment || "",
    body: review.body || review.comment || "",
    createdAt,
    tone: review.tone || pickTone(review.id),
    poster: review.poster || "",
    authorName: review.author_name || review.authorUsername || "",
    authorUsername: review.author_username || review.authorUsername || "",
  };
}

export function normalizeLibraryItem(item) {
  return {
    id: item.id,
    externalId: item.external_id,
    title: item.title || item.external_id,
    creator: cleanOptional(item.creator),
    year: cleanOptional(item.year),
    type: toFrontendType(item.media_type || item.type),
    rating: Number(item.rating) || 0,
    genre: item.genre || "Медиа",
    status: item.status || "Сохранено",
    tone: item.tone || pickTone(item.id),
    note: item.note || "Сохранено в личной библиотеке.",
    poster: item.poster || "",
  };
}
