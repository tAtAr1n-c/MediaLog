import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { requestAuth } from "../services/authApi.js";
import { getCurrentUser } from "../services/apiClient.js";
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from "../utils/authStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getAuthToken);
  const [user, setUser] = useState(getStoredUser);
  const [status, setStatus] = useState(token ? "checking" : "idle");

  const signOut = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    let ignore = false;

    if (!token) {
      setStatus("idle");
      return () => {
        ignore = true;
      };
    }

    setStatus("checking");
    getCurrentUser(token)
      .then((currentUser) => {
        if (!ignore) {
          saveAuthSession({ accessToken: token, user: currentUser });
          setUser(currentUser);
          setStatus("idle");
        }
      })
      .catch(() => {
        if (!ignore) {
          signOut();
        }
      });

    return () => {
      ignore = true;
    };
  }, [signOut, token]);

  const authenticate = useCallback(async (mode, formData) => {
    setStatus("loading");

    try {
      const payload = await requestAuth(mode, formData);
      const nextToken = saveAuthSession(payload);

      setToken(nextToken);
      setUser(payload.user);
      setStatus("idle");

      return payload;
    } catch (error) {
      setStatus("idle");
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      status,
      isAuthenticated: Boolean(token && user),
      authenticate,
      signOut,
    }),
    [authenticate, signOut, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
