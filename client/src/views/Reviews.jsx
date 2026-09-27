import { useEffect, useState } from "react";
import { Link } from "react-router";
import Stars from "../components/Stars";
import { BASE_URL } from "../config";
import "./styles/Favourites.css";
import "./styles/Reviews.css";

const posterUrl = (posterPath) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;

const releaseYear = (releaseDate) =>
  releaseDate ? new Date(`${releaseDate}T00:00:00`).getFullYear() : null;

async function loadMovieDetails(movieIds) {
  const results = await Promise.allSettled(
    movieIds.map(async (movieId) => {
      const response = await fetch(`${BASE_URL}/movies/${movieId}?language=en-US`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Movie details could not be loaded");
      }

      return data;
    }),
  );

  return {
    movies: results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((firstMovie, secondMovie) =>
        (firstMovie.title || "").localeCompare(secondMovie.title || "", undefined, {
          sensitivity: "base",
        }),
      ),
    failedMovieIds: results
      .map((result, index) => (result.status === "rejected" ? movieIds[index] : null))
      .filter(Boolean),
  };
}

function Reviews() {
  const [movies, setMovies] = useState([]);
  const [failedMovieIds, setFailedMovieIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [removingMovieId, setRemovingMovieId] = useState(null);

  const reviewFor = (movieId) =>
    reviews.find((review) => Number(review.movies_tmdb_id) === Number(movieId));

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        const response = await fetch(`${BASE_URL}/reviews/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Reviews could not be loaded");
        }

        const movieIds = (data.reviews || []).map((review) => review.movies_tmdb_id);
        const details = await loadMovieDetails(movieIds);

        if (!cancelled) {
          setReviews(data.reviews || []);
          setMovies(details.movies);
          setFailedMovieIds(details.failedMovieIds);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteReview = async (movieId) => {
    setRemovingMovieId(movieId);
    setActionError(null);

    try {
      const response = await fetch(`${BASE_URL}/reviews/delete/${movieId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Review could not be deleted");
      }

      setReviews((current) => current.filter((review) => Number(review.movies_tmdb_id) !== Number(movieId)));
      setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== movieId));
      setFailedMovieIds((currentIds) => currentIds.filter((id) => id !== movieId));
    } catch (removeError) {
      setActionError(removeError.message);
    } finally {
      setRemovingMovieId(null);
    }
  };

  return (
    <main className="favourites-page">
      <header className="favourites-header">
        <p className="favourites-eyebrow">Your reviews</p>
        <h1>Reviewed movies</h1>
        <p>Movies you have rated and reviewed.</p>
      </header>

      {loading && <div className="favourites-state"><h2>Loading reviews...</h2></div>}
      {!loading && error && (
        <div className="favourites-state favourites-state-error">
          <h2>Reviews could not be loaded</h2>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && reviews.length === 0 && (
        <div className="favourites-state">
          <h2>No reviews yet</h2>
          <p>Review a movie from its details page and it will appear here.</p>
        </div>
      )}
      {!loading && !error && reviews.length > 0 && (
        <>
          {actionError && <p className="favourites-action-error">{actionError}</p>}
          {failedMovieIds.length > 0 && (
            <p className="favourites-partial-warning">
              Some reviewed movies are temporarily unavailable.
            </p>
          )}
          <div className="favourites-grid">
            {movies.map((movie) => {
              const review = reviewFor(movie.id);
              const poster = posterUrl(movie.poster_path);
              const year = releaseYear(movie.release_date);

            return (
              <article className="favourites-movie" key={movie.id}>
                <Link className="favourites-poster" to={`/movie/${movie.id}`}>
                  {poster ? <img src={poster} alt={`${movie.title} poster`} /> : <span>No poster</span>}
                </Link>
                <div className="favourites-movie-info">
                  <h2>{movie.title || "Untitled movie"}</h2>
                  <p>{year || "Release year unavailable"}</p>
                  <Stars value={review?.star} label={`${review?.star} out of 5`} />
                  {review?.review && <p className="reviews-text">{review.review}</p>}
                  <button
                    className="favourites-remove"
                    type="button"
                    disabled={removingMovieId === movie.id}
                    onClick={() => deleteReview(movie.id)}
                  >
                    {removingMovieId === movie.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}

          {failedMovieIds.map((movieId) => (
            <article className="favourites-movie favourites-movie-failed" key={`failed-${movieId}`}>
              <div className="favourites-poster">
                <span>Unavailable</span>
              </div>
              <div className="favourites-movie-info">
                <h2>Movie unavailable</h2>
                <Stars value={reviewFor(movieId)?.star} label={`${reviewFor(movieId)?.star} out of 5`} />
                <button
                  className="favourites-remove"
                  type="button"
                  disabled={removingMovieId === movieId}
                  onClick={() => deleteReview(movieId)}
                >
                 {removingMovieId === movieId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
          </div>
        </>
      )}
    </main>
  );
}

export default Reviews;