import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import MainHeader from "../../components/MainHeader.jsx";
import { createLibraryItem, deleteLibraryItem, getLibraryItems, searchMedia } from "../../services/apiClient.js";
import "./LibraryPage.css";

const filters = [
  { value: "all", label: "Все" },
  { value: "film", label: "Фильмы" },
  { value: "book", label: "Книги" },
];

const emptySpotlight = {
  title: "Поиск по каталогу",
  creator: "OMDB + Google Books",
  year: "Онлайн",
  type: "book",
  rating: 0,
  genre: "Каталог",
  status: "Поиск",
  tone: "iris",
  note: "Введите название фильма или книги.",
};

function formatType(type) {
  return type === "book" ? "Книга" : "Фильм";
}

function getItemKey(item) {
  return `${item.type}-${item.externalId}`;
}

function formatMeta(...values) {
  return values.filter(Boolean).join(" • ");
}

export default function LibraryPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [catalogItems, setCatalogItems] = useState([]);
  const [libraryItems, setLibraryItems] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [catalogState, setCatalogState] = useState("idle");
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadLibrary() {
      setIsLoadingLibrary(true);
      setMessage("");

      try {
        const items = await getLibraryItems(token);

        if (!ignore) {
          setLibraryItems(items);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : "Не удалось загрузить сохраненную полку.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingLibrary(false);
        }
      }
    }

    if (token) {
      loadLibrary();
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const normalizedQuery = query.trim();

  useEffect(() => {
    let ignore = false;

    async function runCatalogSearch() {
      if (normalizedQuery.length < 2) {
        setCatalogItems([]);
        setCatalogState("idle");
        return;
      }

      setCatalogState("loading");
      setMessage("");

      try {
        const items = await searchMedia(normalizedQuery, activeFilter);

        if (!ignore) {
          setCatalogItems(items);
          setCatalogState("idle");
        }
      } catch (error) {
        if (!ignore) {
          setCatalogItems([]);
          setMessage(error instanceof Error ? error.message : "Не удалось выполнить поиск по каталогу.");
          setCatalogState("idle");
        }
      }
    }

    const timer = window.setTimeout(runCatalogSearch, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [activeFilter, normalizedQuery]);

  const savedKeys = useMemo(() => new Set(libraryItems.map(getItemKey)), [libraryItems]);
  const savedItems = useMemo(
    () => libraryItems.filter((item) => activeFilter === "all" || item.type === activeFilter),
    [activeFilter, libraryItems],
  );
  const bookCount = catalogItems.filter((item) => item.type === "book").length;
  const filmCount = catalogItems.filter((item) => item.type === "film").length;
  const featuredItem = catalogItems[0] ?? savedItems[0] ?? emptySpotlight;

  const handleSaveCatalogItem = async (item) => {
    const itemKey = getItemKey(item);
    setSavingKey(itemKey);
    setMessage("");

    try {
      const createdItem = await createLibraryItem(token, {
        ...item,
        status: "Сохранено",
        note: item.note || `Сохранено из ${item.type === "book" ? "Google Books" : "OMDB"}.`,
      });

      setLibraryItems((currentItems) => {
        if (currentItems.some((currentItem) => getItemKey(currentItem) === itemKey)) {
          return currentItems;
        }

        return [createdItem, ...currentItems];
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить тайтл.");
    } finally {
      setSavingKey("");
    }
  };

  const handleDelete = async (itemId) => {
    setMessage("");

    try {
      await deleteLibraryItem(token, itemId);
      setLibraryItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить элемент.");
    }
  };

  const renderCover = (item) => (
    <div className={`library-cover library-tone-${item.tone}`}>
      {item.poster ? <img src={item.poster} alt="" className="library-cover-image" /> : null}
      <span className="library-cover-type">{formatType(item.type)}</span>
      {item.year ? <span className="library-cover-year">{item.year}</span> : null}
      {item.genre ? <strong>{item.genre}</strong> : null}
    </div>
  );

  return (
    <main className="library-page">
      <MainHeader />

      <div className="library-shell">
        <section className="library-hero">
          <article className="library-hero-copy">
            <p className="library-kicker">Глобальный каталог</p>
            <div className="library-title-row">
              <h1>Библиотека</h1>
              <span className="library-count-pill">Найдено: {catalogItems.length}</span>
            </div>
            <p className="library-description">
              Поиск идет по OMDB для фильмов и Google Books для книг. Сохраняй найденные тайтлы в личную полку
              или выбирай их при создании рецензии.
            </p>

            <div className="library-stats">
              <article>
                <span>Найдено книг</span>
                <strong>{catalogState === "loading" ? "..." : bookCount}</strong>
              </article>
              <article>
                <span>Найдено фильмов</span>
                <strong>{catalogState === "loading" ? "..." : filmCount}</strong>
              </article>
              <article>
                <span>Сохранено</span>
                <strong>{isLoadingLibrary ? "..." : libraryItems.length}</strong>
              </article>
            </div>
          </article>

          <article className={`library-spotlight library-tone-${featuredItem.tone}`}>
            <p>Витрина каталога</p>
            <h2>{featuredItem.title}</h2>
            <span>
              {formatType(featuredItem.type)} • {featuredItem.creator}
            </span>
            <strong>{featuredItem.genre}</strong>
            <div className="library-spotlight-footer">
              <small>{featuredItem.year}</small>
              <small>{featuredItem.status}</small>
            </div>
          </article>
        </section>

        <section className="library-toolbar">
          <label className="library-search">
            <span>Поиск в каталоге</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Начни вводить название фильма или книги"
            />
          </label>

          <div className="library-filters">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`library-filter ${activeFilter === filter.value ? "is-active" : ""}`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="library-results">
            {catalogState === "loading"
              ? "Ищем..."
              : normalizedQuery.length < 2
                ? ""
                : `Показано: ${catalogItems.length}`}
          </p>
        </section>

        {message ? <section className="library-empty library-message">{message}</section> : null}

        {normalizedQuery.length < 2 ? (
          <section className="library-empty">
            <h2>Начни с поиска</h2>
            <p>Введи хотя бы два символа, чтобы получить фильмы и книги из внешних каталогов.</p>
          </section>
        ) : null}

        {catalogState === "loading" ? (
          <section className="library-empty">
            <h2>Ищем в каталогах</h2>
            <p>Получаем совпадения из OMDB и Google Books.</p>
          </section>
        ) : null}

        {catalogState !== "loading" && normalizedQuery.length >= 2 && catalogItems.length ? (
          <section className="library-grid">
            {catalogItems.map((item) => {
              const itemKey = getItemKey(item);
              const isSaved = savedKeys.has(itemKey);

              return (
                <article key={item.id} className="library-card">
                  {renderCover(item)}

                  <div className="library-card-body">
                    <div className="library-card-heading">
                      <div>
                        <h3>{item.title}</h3>
                        {formatMeta(item.creator, item.year) ? <p>{formatMeta(item.creator, item.year)}</p> : null}
                      </div>
                      <span className="library-card-status">{item.status}</span>
                    </div>

                    <p className="library-card-note">{item.note}</p>

                    <div className="library-card-footer">
                      <span className="library-card-rating">{item.year || formatType(item.type)}</span>
                      <button
                        type="button"
                        className="library-card-button"
                        onClick={() => handleSaveCatalogItem(item)}
                        disabled={isSaved || savingKey === itemKey}
                      >
                        {isSaved ? "Сохранено" : savingKey === itemKey ? "Сохраняем..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {catalogState !== "loading" && normalizedQuery.length >= 2 && catalogItems.length === 0 ? (
          <section className="library-empty">
            <h2>Ничего не найдено</h2>
            <p>Попробуй другое название или переключи тип контента.</p>
          </section>
        ) : null}

        <section className="library-saved-section">
          <div className="library-saved-head">
            <div>
              <p className="library-kicker">Личная полка</p>
              <h2>Сохраненное</h2>
            </div>
            <span>{savedItems.length} элементов</span>
          </div>

          {isLoadingLibrary ? (
            <section className="library-empty">
              <h2>Загружаем полку</h2>
              <p>Получаем сохраненные элементы с сервера.</p>
            </section>
          ) : null}

          {!isLoadingLibrary && savedItems.length ? (
            <section className="library-grid library-grid-saved">
              {savedItems.map((item) => (
                <article key={item.id} className="library-card">
                  {renderCover(item)}

                  <div className="library-card-body">
                    <div className="library-card-heading">
                      <div>
                        <h3>{item.title}</h3>
                        {formatMeta(item.creator, item.year) ? <p>{formatMeta(item.creator, item.year)}</p> : null}
                      </div>
                      <span className="library-card-status">{item.status}</span>
                    </div>

                    <p className="library-card-note">{item.note}</p>

                    <div className="library-card-footer">
                      <span className="library-card-rating">{item.year || formatType(item.type)}</span>
                      <button type="button" className="library-card-button" onClick={() => handleDelete(item.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {!isLoadingLibrary && savedItems.length === 0 ? (
            <section className="library-empty">
              <h2>Полка пустая</h2>
              <p>Сохрани фильм или книгу из результатов поиска.</p>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
