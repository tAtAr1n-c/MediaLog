const PROFILE_STORAGE_KEY = "medialog-profile";
const REVIEWS_STORAGE_KEY = "medialog-reviews";

export const defaultProfile = {
  displayName: "Salam",
  handle: "@Ultrandon",
  avatarLabel: "UD",
  bio: "Rim Tim Tagi Dim",
  memberSince: "March 2024",
};

export const defaultReviews = [
  {
    id: "review-dune",
    title: "Dune",
    creator: "Denis Villeneuve",
    type: "film",
    rating: 5,
    year: "2021",
    summary: "Редкий блокбастер, который держится на атмосфере и чувстве масштаба.",
    body: "Фильм аккуратно собирает мир, не теряя эмоционального давления. Особенно хорошо работает темп и звук.",
    createdAt: "2026-04-17T19:20:00.000Z",
    tone: "midnight",
  },
  {
    id: "review-piranesi",
    title: "Piranesi",
    creator: "Susanna Clarke",
    type: "book",
    rating: 4,
    year: "2020",
    summary: "Тихая и странная книга, которая держится на ощущении пространства.",
    body: "В ней мало прямого действия, но сильнейшая атмосфера и очень точная внутренняя интонация.",
    createdAt: "2026-04-16T12:40:00.000Z",
    tone: "lilac",
  },
  {
    id: "review-past-lives",
    title: "Past Lives",
    creator: "Celine Song",
    type: "film",
    rating: 5,
    year: "2023",
    summary: "Сдержанная драма о времени, памяти и выборе, который не перестаёт звучать.",
    body: "Нравится её тишина и то, как фильм избегает лишних объяснений. Эмоционально очень точный.",
    createdAt: "2026-04-15T18:05:00.000Z",
    tone: "plum",
  },
  {
    id: "review-arrival",
    title: "Arrival",
    creator: "Denis Villeneuve",
    type: "film",
    rating: 4,
    year: "2016",
    summary: "Фантастика, которая работает как личная история о языке и потере.",
    body: "Один из лучших примеров мягкой научной фантастики, где идея и чувство не спорят друг с другом.",
    createdAt: "2026-04-14T21:15:00.000Z",
    tone: "iris",
  },
  {
    id: "review-never-let-me-go",
    title: "Never Let Me Go",
    creator: "Kazuo Ishiguro",
    type: "book",
    rating: 4,
    year: "2005",
    summary: "Спокойная антиутопия, где главная сила не в событии, а в послевкусии.",
    body: "Книга держится на полутонах и позднем осознании того, что утрачено уже давно.",
    createdAt: "2026-04-12T14:10:00.000Z",
    tone: "midnight",
  },
  {
    id: "review-little-women",
    title: "Little Women",
    creator: "Greta Gerwig",
    type: "film",
    rating: 4,
    year: "2019",
    summary: "Очень живое кино о характере, привязанности и цене личной свободы.",
    body: "Пересобранная структура делает историю свежее, а энергия персонажей работает без провалов.",
    createdAt: "2026-04-10T11:35:00.000Z",
    tone: "lilac",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage(key, fallbackValue) {
  if (!canUseStorage()) {
    return fallbackValue;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

export function loadProfile() {
  const profile = readStorage(PROFILE_STORAGE_KEY, defaultProfile);
  return { ...defaultProfile, ...profile };
}

export function saveProfile(profile) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadReviews() {
  const reviews = readStorage(REVIEWS_STORAGE_KEY, defaultReviews);
  return Array.isArray(reviews) && reviews.length > 0 ? reviews : defaultReviews;
}

export function saveReviews(reviews) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function sortReviewsByDate(reviews) {
  return [...reviews].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

export function formatReviewDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getAverageRating(reviews) {
  if (!reviews.length) {
    return "0.0";
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

export function getReviewTypeLabel(type) {
  return type === "book" ? "Книга" : "Фильм";
}
