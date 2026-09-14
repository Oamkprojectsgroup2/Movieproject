import { useState, useEffect, useRef } from "react";
import "../styles/Theaters.css";
import { BASE_URL } from "../config";
import SearchFilters from "../components/SearchFilters";




const LANGUAGES = {
  en: "English",
  fi: "Finnish",
  sv: "Swedish",
};

function Theaters() {
  const [results, setResults] = useState([]);
  
  const [genre, setGenre] = useState("")
  const [genres, setGenres] = useState([]);
  const [language, setLanguage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);


  /*
   * Automatically load currently playing movies
   * when the Theaters page is opened.
   */
  useEffect(() => {
    handleSearch(1);
  }, []);

  const handleSearch = async (pageNumber = 1) => {
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    setError(null);

    try {
      const params = new URLSearchParams();

      // English movie information
      params.append("language", "en-US");

      // Currently playing in Finland
      params.append("region", "FI");

      // Pagination
      params.append("page", pageNumber);


      const response = await fetch(
        `${BASE_URL}/movies/nowplaying?${params.toString()}`
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

      if (pageNumber === 1) {
        setResults(newResults);
      } else {
        setResults((currentResults) => {
          const combined = [
            ...currentResults,
            ...newResults,
          ];

          // Remove duplicate movies by TMDB ID
          const uniqueResults = Array.from(
            new Map(
              combined.map((movie) => [
                movie.id,
                movie,
              ])
            ).values()
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
    if (
      page < totalPages &&
      !loadingMore
    ) {
      handleSearch(page + 1);
    }
  };

  const getTitle = (movie) => {
    return movie.title || "Untitled";
  };

  const getYear = (movie) => {
    const releaseDate =
      movie.release_date || "";

    return releaseDate
      ? releaseDate.slice(0, 4)
      : "N/A";
  };

  const getGenres = (movie) => {
    if (!movie.genre_ids) {
      return "N/A";
    }

    return movie.genre_ids
      .map((id) => genres.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "N/A";
  };

  const getLanguage = (movie) => {
    return (
      LANGUAGES[movie.original_language] ||
      movie.original_language ||
      "N/A"
    );
  };

  const getRating = (movie) => {
    return movie.vote_average
      ? movie.vote_average
      : null;
  };

  /*
   * Apply the filters to the currently loaded movies.
   */
  const filteredResults = results.filter(
    (movie) => {
      const movieGenres =
        movie.genre_ids || [];

      const movieLanguage =
        movie.original_language || "";

      const matchesGenre =
        !genre ||
        movieGenres.includes(
          Number(genre)
        );

      const matchesLanguage =
        !language ||
        movieLanguage === language;

      return (
        matchesGenre &&
        matchesLanguage
      );
    }
  );

  const MIN_VISIBLE_RESULTS = 20;
  const MAX_AUTO_PAGES = 5;

  const autoPageCount = useRef(0);

  useEffect(() => {
    autoPageCount.current = 0;
  }, [genre, language]);

  useEffect(() => {
    if (
      (genre || language) &&
      !loading &&
      !loadingMore &&
      !error &&
      filteredResults.length < MIN_VISIBLE_RESULTS &&
      page < totalPages &&
      autoPageCount.current < MAX_AUTO_PAGES
    ) {
      autoPageCount.current += 1;
      handleSearch(page + 1);
    }
  }, [filteredResults.length, page, totalPages, loading, loadingMore, error, genre, language]);

  return (
    <main className="theaters-page">

      <div className="theaters-content">

        {/* TITLE */}

        <h1 className="theaters-title">
          Now showing in theaters across Finland
        </h1>


        {/* FILTERS */}

        <div className="theaters-filters">

          <div className="theaters-filter">

            <SearchFilters
              genre={genre} setGenre={setGenre}
              language={language} setLanguage={setLanguage}
              contentType="movie"
              siteLanguage="en-US"
              showYear={false}
              onGenresLoaded={setGenres}
              className="theaters-filter-fields"
              showExtra={false}
            />

          </div>

        </div>


        {/* RESULTS */}

        <section className="theaters-results">

          {loading && (
            <div className="theaters-message">
              <h2>
                Loading movies...
              </h2>
            </div>
          )}


          {!loading && error && (
            <div className="theaters-message">

              <h2>
                Could not load movies
              </h2>

              <p>
                {error}
              </p>

            </div>
          )}


          {!loading &&
            !error &&
            filteredResults.length === 0 && (
              <div className="theaters-message">

                <h2>
                  No movies found
                </h2>

                <p>
                  Try changing your filters.
                </p>

              </div>
            )}


          {!loading &&
            !error &&
            filteredResults.length > 0 && (

              <div className="theaters-grid">

                {filteredResults.map(
                  (movie) => {

                    const title =
                      getTitle(movie);

                    const rating =
                      getRating(movie);

                    const stars =
                      rating !== null
                        ? Math.round(
                            rating / 2
                          )
                        : 0;

                    return (
                      <article
                        className="theaters-result"
                        key={movie.id}
                      >

                        {/* POSTER */}

                        <div className="theaters-poster">

                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={`${title} poster`}
                            />
                          ) : (
                            <span>
                              Poster
                            </span>
                          )}

                        </div>


                        {/* INFORMATION */}

                        <div className="theaters-info">

                          <h2>
                            {title}
                          </h2>


                          {/* RATING */}

                          <div className="theaters-rating">

                            <span>
                              {"★".repeat(
                                stars
                              )}
                            </span>

                            <span className="rating-empty">
                              {"★".repeat(
                                5 - stars
                              )}
                            </span>

                            {rating !== null && (
                              <span>
                                {" "}
                                {rating.toFixed(
                                  1
                                )}/10
                              </span>
                            )}

                          </div>


                          <p>
                            <strong>
                              Genre:
                            </strong>{" "}
                            {getGenres(movie)}
                          </p>


                          <p>
                            <strong>
                              Year:
                            </strong>{" "}
                            {getYear(movie)}
                          </p>


                          <p>
                            <strong>
                              Language:
                            </strong>{" "}
                            {getLanguage(movie)}
                          </p>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>


        {/* LOAD MORE */}

        {!loading &&
          !error &&
          results.length > 0 &&
          page < totalPages && (

            <div className="theaters-load-more-container">

              <button
                className="theaters-load-more"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? "Loading..."
                  : "Load More"}
              </button>

              {(genre || language) && (
                <p className="theaters-load-more-hint">
                  With filters active, it can take a few extra pages to find matching movies.
                </p>
              )}

            </div>

          )}

      </div>

    </main>
  );
}

export default Theaters;