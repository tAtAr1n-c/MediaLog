const AUTH_TOKEN_KEY = "medialog.jwt";
const AUTH_USER_KEY = "medialog.user";

function readNestedValue(source, path) {
  return path.split(".").reduce((current, key) => current?.[key], source);
}

export function extractJwtToken(payload) {
  const candidates = [
    "token",
    "access_token",
    "accessToken",
    "jwt",
    "data.access_token",
    "data.token",
    "data.accessToken",
    "data.jwt",
    "result.token",
    "result.accessToken",
    "result.jwt",
    "payload.token",
    "payload.accessToken",
  ];

  return candidates
    .map((path) => readNestedValue(payload, path))
    .find((value) => typeof value === "string" && value.length > 0);
}

export function extractUser(payload) {
  return payload?.user ?? payload?.data?.user ?? payload?.result?.user ?? null;
}

export function saveAuthSession(payload) {
  const token = extractJwtToken(payload);

  if (!token) {
    return null;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);

  const user = extractUser(payload);
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  return token;
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const rawValue = window.localStorage.getItem(AUTH_USER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}
