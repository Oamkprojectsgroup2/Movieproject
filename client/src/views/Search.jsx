import { useState, useEffect, useMemo, useRef } from "react";
import "../styles/Search.css";

const BASE_URL = "http://localhost:3001/api";

function Search({
  search,
  setSearch,
  genre,
  setGenre,
  year,
  setYear,
  language,
  setLanguage,
  searchTrigger,
  siteLanguage,
}) {
  const [hasSearched, setHasSearched] = useState(false);

  const [contentType, setContentType] = useState("movie");

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [page, setPage] =useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const endpoint =
          contentType === "movie"
            ? "/movies/genres"
            : "/tv/genres";

        const response = await fetch(
          `${BASE_URL}${endpoint}?language=${siteLanguage}`
        );

        const data = await response.json();

        setGenres(data.genres || []);
      } catch (err) {
        setGenres([]);
      }
    };

    fetchGenres();
  }, [contentType, siteLanguage]);

  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${BASE_URL}/config/languages`);
        const data = await response.json();
        setLanguages(data || []);
      } catch (err) {
        setLanguages([]);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
  if (search.trim()) {
    handleSearch();
  }
}, []);

useEffect(() => {
  if (search.trim()) {
    handleSearch();
  }
}, [contentType]);

useEffect(() => {
  if (searchTrigger > 0 && search.trim()) {
    handleSearch();
  }
}, [searchTrigger]);


  const handleSearch = async (e, pageNumber = 1) => {
    if (e) {
    e.preventDefault();
    }
 
    if (!search.trim()) {
      setResults([]);
      setHasSearched(true);
      setError(null);
      return;
    }
    if (pageNumber === 1){
    setLoading(true);
    }
    else {
      setLoadingMore(true);
    }

    setError(null);
    setHasSearched(true);

    try {
      const endpoint =
        contentType === "movie"
          ? "/movies/search"
          : "/tv/search";

      const params = new URLSearchParams();

      params.append(
        "query",
        search.trim()
      );

      params.append(
        "language",
        "en-US"
      );

      params.append(
        "region",
        "FI"
      );

      params.append (
        "page",
        pageNumber
      );

      const response = await fetch(
        `${BASE_URL}${endpoint}?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.status_message ||
          `Server error: ${response.status}`
        );
      }

      const newResults = data.results || [];

        if (pageNumber === 1)
        {
          setResults(newResults);
        }
        else {
          setResults((currentResults) => {
            const combined = [
              ...currentResults,
              ...newResults
            ];

            const uniqueResults = Array.from(
              new Map(
                combined.map((item) => [item.id, item])
              ) .values()
            );
            return uniqueResults;
        });
        }
        setPage(pageNumber);
        setTotalPages(data.total_pages || 1);
      
    } catch (err) {
      setError(err.message);

      if (pageNumber === 1) {
        setResults([]);
      }
      
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }; 

  const handleLoadMore = () => {
    if (page < totalPages &&!loadingMore)
    {
      handleSearch(null, page + 1);
    }
  };


  const clearFilters = () => {
    setGenre("");
    setYear("");
    setYearInput("");
    setYearError(null);
    setLanguage("");
    setLanguageInput("");
  };

  const [yearInput, setYearInput] =useState("");
  const [yearError, setYearError] = useState(null);

  const handleYearInput = (value) => {
    setYearInput(value);

    if (!value) {
      setYearError(null);
      setYear("");
      return;
    }

    const currentMax = new Date().getFullYear() + 10;
    const numericValue = Number(value);

    if (!/^\d{4}$/.test(value) || numericValue < 1900 || numericValue > currentMax) {
      setYearError(`Enter a year between 1900 and ${currentMax}`);
      setYear("");
      return;
    }

    setYearError(null);
    setYear(value);
  };

  const [languageInput, setLanguageInput] = useState("");

  const handleLanguageInput = (e) => {
    setLanguageInput(e);
    const match = languages.find(
      (l) => l.english_name.toLowerCase() === e.toLowerCase()
    );
    setLanguage(match ? match.iso_639_1 : "");
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      if(genre && !(item.genre_ids || []).includes(Number(genre))) {
        return false;
      }
      if(year) {
        const releaseDate = item.release_date || item.first_air_date || "";
        if(releaseDate.slice(0, 4) !== year) {
          return false;
        }
      }
      if (language && item.original_language !== language) {
        return false;
      }
      return true;
    });
  }, [results, genre, year, language]);

  const MIN_VISIBLE_RESULTS = 20;
  const MAX_AUTO_PAGES = 5;

  const autoPageCount = useRef(0);

  useEffect(() => {
    autoPageCount.current = 0;
  }, [search, contentType, searchTrigger, genre, year, language]);

  useEffect(() => {
    if (
      (genre || year || language) &&
      !loading &&
      !loadingMore &&
      !error &&
      hasSearched &&
      filteredResults.length < MIN_VISIBLE_RESULTS &&
      page < totalPages &&
      autoPageCount.current < MAX_AUTO_PAGES
    ) {
      autoPageCount.current += 1;
      handleSearch(null, page + 1);
    }
  }, [filteredResults.length, page, totalPages, loading, loadingMore, error, hasSearched, genre, year, language]);

  return (
    <main className="search-page">

      <div className="search-content">

        {/* LEFT / MAIN AREA */}

        <section className="search-results-area">

          {/* SEARCH BAR */}

          <form
            className="search-page-search"
            onSubmit={handleSearch}
          >

            <div className="search-input-wrapper">

              <span className="search-icon">
                🔍
              </span>

              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <button type="submit">
              Search
            </button>

          </form>


          {/* CONTENT TYPE */}

          <div className="search-type">

            <button
              type="button"
              className={
                contentType === "movie"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setContentType("movie")
              }
            >
              Movies
            </button>

            <button
              type="button"
              className={
                contentType === "tv"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setContentType("tv")
              }
            >
              TV Shows
            </button>

          </div>


          {/* RESULTS */}

          <div className="search-results">

            {loading && (
              <div className="no-results">
                <h2>
                  Searching...
                </h2>
              </div>
            )}



            {!loading && error && (
              <div className="no-results">

                <h2>
                  Search error
                </h2>

                <p>
                  {error}
                </p>

              </div>
            )}


            {!loading &&
              !error &&
              hasSearched &&
              filteredResults.length === 0 && (

                <div className="no-results">

                  <h2>
                    No results found
                  </h2>

                  <p>
                    Try changing your search or filters.
                  </p>

                </div>

              )}


            {!loading &&
              !error &&
              filteredResults.length > 0 && (

                filteredResults.map((item) => {

                  const title =
                    item.title ||
                    item.name ||
                    "Untitled";

                  const genreName =
                    (item.genre_ids || [])
                      .map((id) =>
                        genres.find((g) => g.id === id)?.name
                    )
                    .filter(Boolean)
                    .join(", ");

                  const releaseDate =
                    item.release_date ||
                    item.first_air_date ||
                    "";

                  const resultYear =
                    releaseDate
                      ? releaseDate.slice(0, 4)
                      : "N/A";

                  const rating =
                    item.vote_average
                      ? item.vote_average
                      : null;

                  const stars =
                    rating !== null
                      ? Math.round(rating / 2)
                      : 0;

                  return (
                    <article
                      className="search-result"
                      key={item.id}
                    >

                      {/* POSTER */}

                      <div className="search-result-poster">

                        {item.poster_path ? (

                          <img
                            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                            alt={`${title} poster`}
                          />

                        ) : (

                          <span>
                            Poster
                          </span>

                        )}

                      </div>


                      {/* INFORMATION */}

                      <div className="search-result-info">

                        <h2>
                          {title}
                        </h2>


                        <div className="search-result-rating">

                          <span>
                            {"★".repeat(stars)}
                          </span>

                          <span className="rating-empty">
                            {"★".repeat(5 - stars)}
                          </span>

                          {rating !== null && (
                            <span>
                              {" "}
                              {rating.toFixed(1)}/10
                            </span>
                          )}

                        </div>


                        <p>
                          <strong>Genre:</strong>{" "}
                          {genreName || "N/A"}
                        </p>


                        <p>
                          <strong>Year:</strong>{" "}
                          {resultYear}
                        </p>


                        <p>
                          <strong>Language:</strong>{" "}
                          {item.original_language || "N/A"}
                        </p>

                      </div>

                    </article>
                  );
                })

              )}

          </div>
          {!loading &&
          !error &&
          filteredResults.length > 0 && 
          page < totalPages && (
            <div className="load-more-container">

              <button
              className="load-more"
              onClick={handleLoadMore}
              disabled={loadingMore}

              >
                {loadingMore
                ? "Loading..."
                : "Load More"}
              </button>
            </div>
          )}

        </section>


        {/* RIGHT FILTER PANEL */}

        <aside className="search-filters">

          <h2>
            Filters
          </h2>


          <div className="search-filter">

            <label htmlFor="search-genre">
              Genre
            </label>

            <select
              id="search-genre"
              value={genre}
              onChange={(e) =>
                setGenre(e.target.value)
              }
            >

              <option value="">
                Any
              </option>

              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

          </div>


          <div className="search-filter">

            <label htmlFor="search-year">
              Year
            </label>
            
            <input
              id="search-year"
              type="number"
              placeholder="any"
              min="1900"
              max={new Date().getFullYear() + 10}
              value={yearInput}
              onChange={(e) =>
                handleYearInput(e.target.value)
              }
            />
            {yearError && (
              <p className="field-error">{yearError}</p>
            )}
          </div>

          <div className="search-filter">

            <label htmlFor="search-language">
              Language
            </label>

          <input
            id="search-language"
            list="language-options"
            type="text"
            placeholder="Any"
            value={languageInput}
            onChange={(e) => handleLanguageInput(e.target.value)}
          />

          <datalist id="language-options">
            {languages.map((lang) => (
              <option key={lang.iso_639_1} value={lang.english_name} />
            ))}
          </datalist>


          </div>


          <button
            className="clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </aside>

      </div>

    </main>
  );
}

export default Search;