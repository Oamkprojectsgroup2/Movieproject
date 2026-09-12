import { useState, useEffect } from "react";
import "../styles/Home.css";

const BASE_URL = "http://localhost:3001/api";

function Home({
  search,
  setSearch,
  genre,
  setGenre,
  year,
  setYear,
  language,
  setLanguage,
  setCurrentPage,
}) {
  const [activeRecommendation, setActiveRecommendation] = useState(0);

  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);

  // TMDB language/region settings
  // These can later be moved to shared application state if needed.
  const tmdbLanguage = "en-US";
  const tmdbRegion = "FI";

  // Fetch recommended movies from backend
  useEffect(() => {
    const fetchRecommendedMovies = async () => {
      setLoadingRecommendations(true);
      setRecommendationError(null);

      try {
        const response = await fetch(
          `${BASE_URL}/movies/popular?language=${tmdbLanguage}&region=${tmdbRegion}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            data.status_message ||
            `Server error: ${response.status}`
          );
        }

        setRecommendedMovies(data.results || []);
      } catch (err) {
        setRecommendationError(err.message);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendedMovies();
  }, []);

  // Keep active recommendation valid when results change
  useEffect(() => {
    if (
      recommendedMovies.length > 0 &&
      activeRecommendation >= recommendedMovies.length
    ) {
      setActiveRecommendation(0);
    }
  }, [recommendedMovies, activeRecommendation]);

  // Automatically change movie every 6 seconds
  useEffect(() => {
    if (recommendedMovies.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveRecommendation((current) =>
        current === recommendedMovies.length - 1
          ? 0
          : current + 1
      );
    }, 6000);

    return () => clearInterval(timer);
  }, [recommendedMovies.length]);

  const currentMovie =
    recommendedMovies.length > 0
      ? recommendedMovies[activeRecommendation]
      : null;

  const handleSearch = (e) => {
    e.preventDefault();

    setCurrentPage("search");
  };

  return (
    <main className="home">

      {/* SEARCH */}

      <section className="home-hero">

        <h1 className="home-title">
          Movie Explorer
        </h1>

        <form
          className="home-search"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            placeholder="Search Movies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button type="submit">
            Search
          </button>
        </form>

        {/* FILTERS */}

        <div className="home-filters">

          <div className="home-filter">
            <label htmlFor="genre">
              Genre
            </label>

            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
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

          <div className="home-filter">
            <label htmlFor="year">
              Year
            </label>

            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
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

          <div className="home-filter">
            <label htmlFor="language">
              Language
            </label>

            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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

        </div>

      </section>


      {/* RECOMMENDED */}

      <section className="recommended">
        <div className="postcard">
        <h2 className="recommended-title">
          Recommended
        </h2>

        {loadingRecommendations && (
          <p>Loading recommendations...</p>
        )}

        {recommendationError && (
          <p>
            Unable to load recommendations.
          </p>
        )}

        {!loadingRecommendations &&
          !recommendationError &&
          recommendedMovies.length === 0 && (
            <p>
              No recommendations available.
            </p>
          )}

        {/* CAROUSEL */}

        {!loadingRecommendations &&
          !recommendationError &&
          currentMovie && (
            <>
              {/* CAROUSEL DOTS */}

              <div className="carousel-dots">

                {recommendedMovies.map((_, index) => (
                  <button
                    key={index}
                    className={
                      activeRecommendation === index
                        ? "carousel-dot active"
                        : "carousel-dot"
                    }
                    onClick={() =>
                      setActiveRecommendation(index)
                    }
                    aria-label={`Recommendation ${index + 1}`}
                  />
                ))}

              </div>


              {/* MOVIE */}

              <div className="recommended-movie">
                  
                {/* PREVIOUS */}

                <button
                  className="carousel-arrow"
                  onClick={() =>
                    setActiveRecommendation((current) =>
                      current === 0
                        ? recommendedMovies.length - 1
                        : current - 1
                    )
                  }
                  aria-label="Previous recommendation"
                >
                  ‹
                </button>


                {/* POSTER */}

                <div className="movie-poster">

                  {currentMovie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`}
                      alt={currentMovie.title || "Movie poster"}
                    />
                  ) : (
                    <span>
                      Poster
                    </span>
                  )}

                </div>


                {/* MOVIE INFORMATION */}

                <div className="movie-info">

                  <h3>
                    {currentMovie.title || "Untitled"}
                  </h3>

                  <div className="movie-rating">

                    <span>
                      {"★".repeat(
                        Math.round(
                          (currentMovie.vote_average || 0) / 2
                        )
                      )}
                    </span>

                    <span className="rating-empty">
                      {"★".repeat(
                        5 -
                        Math.round(
                          (currentMovie.vote_average || 0) / 2
                        )
                      )}
                    </span>

                  </div>

                  <p>
                    <strong>Genre:</strong>{" "}
                    TMDB data
                  </p>

                  <p>
                    <strong>Language:</strong>{" "}
                    {currentMovie.original_language || "N/A"}
                  </p>

                </div>


                {/* NEXT */}

                <button
                  className="carousel-arrow"
                  onClick={() =>
                    setActiveRecommendation((current) =>
                      current === recommendedMovies.length - 1
                        ? 0
                        : current + 1
                    )
                  }
                  aria-label="Next recommendation"
                >
                  ›
                </button>

              </div>
            </>
          )}
        </div>
      </section>

    </main>
  );
}

export default Home;