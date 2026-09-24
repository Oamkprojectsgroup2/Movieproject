import { useEffect, useState } from "react";
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

function Favourites() {
  const [movies, setMovies] = useState([]);
  const [failedMovieIds, setFailedMovieIds] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [removingMovieId, setRemovingMovieId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const response = await fetch(`${BASE_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Favorites could not be loaded");
        }

        const movieIds = (data.favorites || []).map((favorite) => favorite.movie_id);
        const details = await loadMovieDetails(movieIds);

        if (!cancelled) {
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

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeFavorite = async (movieId) => {
    setRemovingMovieId(movieId);
    setActionError(null);

    try {
      const response = await fetch(`${BASE_URL}/favorites/${movieId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Favorite could not be removed");
      }

      setFavoriteIds((currentIds) => currentIds.filter((id) => id !== movieId));
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
        <p className="favourites-eyebrow">Your collection</p>
        <h1>Favorite movies</h1>
        <p>Movies you have saved for later.</p>
      </header>

      {loading && <div className="favourites-state"><h2>Loading favorites...</h2></div>}
      {!loading && error && (
        <div className="favourites-state favourites-state-error">
          <h2>Favorites could not be loaded</h2>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && favoriteIds.length === 0 && (
        <div className="favourites-state">
          <h2>Your list is empty</h2>
          <p>Save a movie from search and it will appear here.</p>
        </div>
      )}
      {!loading && !error && favoriteIds.length > 0 && (
        <>
          {actionError && <p className="favourites-action-error">{actionError}</p>}
          {failedMovieIds.length > 0 && (
            <p className="favourites-partial-warning">
              Some saved movies are temporarily unavailable.
            </p>
          )}
          <FavoriteMovieList
            movies={movies}
            failedMovieIds={failedMovieIds}
            onRemove={removeFavorite}
            removingMovieId={removingMovieId}
          />
        </>
      )}
    </main>
  );
}

export default Favourites;