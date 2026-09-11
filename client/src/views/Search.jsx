import { useState, useEffect } from "react";
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
}) {
  const [hasSearched, setHasSearched] = useState(false);

  const [contentType, setContentType] = useState("movie");

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

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


  const handleSearch = async (e) => {
    if (e) {
    e.preventDefault();
    }
 
    if (!search.trim()) {
      setResults([]);
      setHasSearched(true);
      setError(null);
      return;
    }

    setLoading(true);
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

      setResults(data.results || []);

    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };


  const clearFilters = () => {
    setGenre("");
    setYear("");
    setLanguage("");
  };


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
              results.length === 0 && (

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
              results.length > 0 && (

                results.map((item) => {

                  const title =
                    item.title ||
                    item.name ||
                    "Untitled";

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
                          Not provided by search endpoint
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

              <option value="Action">
                Action
              </option>

              <option value="Drama">
                Drama
              </option>

              <option value="Comedy">
                Comedy
              </option>

            </select>

          </div>


          <div className="search-filter">

            <label htmlFor="search-year">
              Year
            </label>

            <select
              id="search-year"
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
            >

              <option value="">
                Any
              </option>

              <option value="2024">
                2024
              </option>

              <option value="2023">
                2023
              </option>

              <option value="2022">
                2022
              </option>

            </select>

          </div>


          <div className="search-filter">

            <label htmlFor="search-language">
              Language
            </label>

            <select
              id="search-language"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
            >

              <option value="">
                Any
              </option>

              <option value="English">
                English
              </option>

              <option value="Finnish">
                Finnish
              </option>

              <option value="Swedish">
                Swedish
              </option>

            </select>

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