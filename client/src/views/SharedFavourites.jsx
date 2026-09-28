import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import "./styles/SharedFavourites.css";

function SharedFavourites() {
  const params = new URLSearchParams(window.location.search);
  const usernameFromUrl = params.get("username");

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = usernameFromUrl || storedUser?.user_name || "User";

  useEffect(() => {
    let cancelled = false;

   
    const userId = params.get("userId");
    
    async function loadSharedFavorites() {
      try {
        if (!userId) {
          throw new Error("No shared favourites found for this link.");
        }

        const sharedResponse = await fetch(`${BASE_URL}/favorites/share/${userId}`);

        if (!sharedResponse.ok) {
          const data = await sharedResponse.json().catch(() => ({}));
          throw new Error(data.message || "Could not load favourites.");
        }

        const sharedData = await sharedResponse.json();

        const movieIds = (sharedData.favorites || []).map((item) => item.movie_id);

        const results = await Promise.allSettled(
          movieIds.map(async (movieId) => {
            const response = await fetch(`${BASE_URL}/movies/${movieId}?language=en`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(data.message || "Movie details could not be loaded");
            }

            return data;
          })
        );

        if (cancelled) return;

        const loadedMovies = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        setMovies(loadedMovies);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch");
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
  }, []);

  const titleText = `${username}'s favorite list`;

  return (
    <main className="shared-favourites-page">
      <header className="shared-favourites-header">
        <div>
          <p className="shared-favourites-eyebrow">Shared collection</p>
          <h1>{titleText}</h1>
          
          <p>{username}'s publicly shared favorites</p>
        </div>
      </header>

      {loading && (
        <div className="shared-favourites-state">
          <h2>Loading favorites...</h2>
        </div>
      )}

      {!loading && error && (
        <div className="shared-favourites-state shared-favourites-state-error">
          <h2>Shared favorites could not be loaded</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="shared-favourites-state">
          <h2>Your list is empty</h2>
        </div>
      )}

      {!loading && !error && movies.length > 0 && (
        <div className="shared-favourites-grid">
          {movies.map((movie) => {
            const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";

            return (
              <article key={movie.id} className="shared-favourites-movie">
                <div className="shared-favourites-poster">
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "https://via.placeholder.com/500x750?text=No+Image"
                    }
                    alt={movie.title}
                  />
                </div>

                <div className="shared-favourites-movie-info">
                  <h2>{movie.title}</h2>
                  <p>{year}</p>
                  <p className="shared-favourites-rating">
                    Rating {movie.vote_average != null ? `${Number(movie.vote_average).toFixed(1)} / 10` : "N/A"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default SharedFavourites;