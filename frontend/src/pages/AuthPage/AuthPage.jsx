import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import "./AuthPage.css";

function createInitialForms() {
  return {
    signIn: {
      email: "",
      password: "",
    },
    signUp: {
      fullName: "",
      email: "",
      password: "",
    },
  };
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [forms, setForms] = useState(createInitialForms);
  const [submittingMode, setSubmittingMode] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  const isSignUp = location.pathname === "/sign-up";
  const currentMode = isSignUp ? "sign-up" : "sign-in";
  const activeForm = isSignUp ? forms.signUp : forms.signIn;

  const overlayContent = useMemo(
    () =>
      isSignUp
        ? {
            title: "С возвращением!",
            text: "Войди в аккаунт, чтобы продолжить вести свои рецензии и медиатеку.",
            buttonLabel: "Войти",
            to: "/sign-in",
          }
        : {
            title: "Привет!",
            text: "Создай аккаунт, чтобы сохранять книги и фильмы, писать рецензии и собирать личную библиотеку.",
            buttonLabel: "Регистрация",
            to: "/sign-up",
          },
    [isSignUp],
  );

  const handleChange = (mode, field, value) => {
    setForms((current) => ({
      ...current,
      [mode]: {
        ...current[mode],
        [field]: value,
      },
    }));
  };

  const switchMode = (nextPath) => {
    setStatus({ type: "", message: "" });
    navigate(nextPath);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmittingMode(currentMode);
    setStatus({ type: "", message: "" });

    try {
      await authenticate(currentMode, activeForm);

      setStatus({
        type: "success",
        message: "Вход выполнен. Перенаправляю в профиль.",
      });

      window.setTimeout(() => {
        navigate(location.state?.from?.pathname || "/profile");
      }, 450);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Не удалось выполнить запрос.",
      });
    } finally {
      setSubmittingMode("");
    }
  };

  return (
    <main className="auth-page">
      <MainHeader showAuthLinks={false} />

      <section className="auth-shell">
        <div className={`auth-card ${isSignUp ? "is-sign-up" : "is-sign-in"}`}>
          <div className="auth-forms">
            <form className="auth-form auth-form-sign-in" onSubmit={handleSubmit}>
              <div className="auth-form-head">
                <p>Аккаунт MediaLog</p>
                <h1>Вход</h1>
              </div>

              <label className="auth-field">
                <span>Электронная почта</span>
                <input
                  type="email"
                  value={forms.signIn.email}
                  onChange={(event) => handleChange("signIn", "email", event.target.value)}
                  placeholder="Электронная почта"
                  autoComplete="email"
                />
              </label>

              <label className="auth-field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={forms.signIn.password}
                  onChange={(event) => handleChange("signIn", "password", event.target.value)}
                  placeholder="Пароль"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                className="auth-submit-button"
                disabled={submittingMode === "sign-in" || currentMode !== "sign-in"}
              >
                {submittingMode === "sign-in" ? "Входим..." : "Войти"}
              </button>
            </form>

            <form className="auth-form auth-form-sign-up" onSubmit={handleSubmit}>
              <div className="auth-form-head">
                <p>Аккаунт MediaLog</p>
                <h1>Создать аккаунт</h1>
              </div>

              <label className="auth-field">
                <span>Имя</span>
                <input
                  type="text"
                  value={forms.signUp.fullName}
                  onChange={(event) => handleChange("signUp", "fullName", event.target.value)}
                  placeholder="Имя"
                  autoComplete="name"
                />
              </label>

              <label className="auth-field">
                <span>Электронная почта</span>
                <input
                  type="email"
                  value={forms.signUp.email}
                  onChange={(event) => handleChange("signUp", "email", event.target.value)}
                  placeholder="Электронная почта"
                  autoComplete="email"
                />
              </label>

              <label className="auth-field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={forms.signUp.password}
                  onChange={(event) => handleChange("signUp", "password", event.target.value)}
                  placeholder="Пароль"
                  autoComplete="new-password"
                />
              </label>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={submittingMode === "sign-up" || currentMode !== "sign-up"}
              >
                {submittingMode === "sign-up" ? "Создаем..." : "Зарегистрироваться"}
              </button>
            </form>
          </div>

          <aside className="auth-overlay-panel">
            <div className="auth-overlay-content">
              <p className="auth-overlay-kicker">MediaLog</p>
              <h2>{overlayContent.title}</h2>
              <p>{overlayContent.text}</p>
              <button type="button" className="auth-switch-button" onClick={() => switchMode(overlayContent.to)}>
                {overlayContent.buttonLabel}
              </button>
            </div>
          </aside>
        </div>

        {status.message ? (
          <div className={`auth-status ${status.type ? `is-${status.type}` : ""}`} aria-live="polite">
            {status.message}
          </div>
        ) : null}

        <div className="auth-mobile-switch">
          <span>{isSignUp ? "Уже есть аккаунт?" : "Нужен аккаунт?"}</span>
          <Link to={isSignUp ? "/sign-in" : "/sign-up"} onClick={() => setStatus({ type: "", message: "" })}>
            {isSignUp ? "Перейти ко входу" : "Перейти к регистрации"}
          </Link>
        </div>
      </section>
    </main>
  );
}
