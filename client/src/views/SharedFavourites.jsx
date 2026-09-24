import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import FavoriteMovieList from "../components/FavoriteMovieList";
import { BASE_URL } from "../config";
import "./styles/Favourites.css";

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
      .map((result) => result.value),
    failedMovieIds: results
      .map((result, index) => (result.status === "rejected" ? movieIds[index] : null))
      .filter(Boolean),
  };
}

function SharedFavourites() {
  const { sharedToken } = useParams();
  const [ownerName, setOwnerName] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [movies, setMovies] = useState([]);
  const [failedMovieIds, setFailedMovieIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSharedFavorites() {
      try {
        const response = await fetch(`${BASE_URL}/favorites/shared/${sharedToken}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "This shared list is not available");
        }

        const movieIds = (data.favorites || []).map((favorite) => favorite.movie_id);
        const details = await loadMovieDetails(movieIds);

        if (!cancelled) {
          setOwnerName(data.user_name);
          setFavoriteIds(movieIds);
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

    loadSharedFavorites();
    return () => {
      cancelled = true;
    };
  }, [sharedToken]);

  return (
    <main className="favourites-page">
      <header className="favourites-header">
        <p className="favourites-eyebrow">Shared collection</p>
        <h1>{ownerName ? `${ownerName}'s favorite movies` : "Favorite movies"}</h1>
        <p>A movie list shared with you.</p>
      </header>

      {loading && <div className="favourites-state"><h2>Loading favorites...</h2></div>}
      {!loading && error && (
        <div className="favourites-state favourites-state-error">
          <h2>Shared list not available</h2>
          <p>{error}</p>
          <Link className="favourites-link" to="/">Return home</Link>
        </div>
      )}
      {!loading && !error && favoriteIds.length === 0 && (
        <div className="favourites-state">
          <h2>This list is empty</h2>
          <p>{ownerName || "This user"} has not saved any movies yet.</p>
        </div>
      )}
      {!loading && !error && favoriteIds.length > 0 && (
        <>
          {failedMovieIds.length > 0 && (
            <p className="favourites-partial-warning">
              Some saved movies are temporarily unavailable.
            </p>
          )}
          <FavoriteMovieList movies={movies} failedMovieIds={failedMovieIds} />
        </>
      )}
    </main>
  );
}

export default SharedFavourites;