const posterUrl = (posterPath) =>
  posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;

const releaseYear = (releaseDate) =>
  releaseDate ? new Date(`${releaseDate}T00:00:00`).getFullYear() : null;

function FavoriteMovieList({ movies, failedMovieIds, onRemove, removingMovieId }) {
  return (
    <div className="favourites-grid">
      {movies.map((movie) => {
        const year = releaseYear(movie.release_date);
        const poster = posterUrl(movie.poster_path);

        return (
          <article className="favourites-movie" key={movie.id}>
            <div className="favourites-poster">
              {poster ? (
                <img src={poster} alt={`${movie.title} poster`} />
              ) : (
                <span>No poster</span>
              )}
            </div>
            <div className="favourites-movie-info">
              <h2>{movie.title || "Untitled movie"}</h2>
              <p>{year || "Release year unavailable"}</p>
              <p className="favourites-rating">
                {movie.vote_average ? `Rating ${movie.vote_average.toFixed(1)} / 10` : "No rating"}
              </p>
              {onRemove && (
                <button
                  className="favourites-remove"
                  type="button"
                  disabled={removingMovieId === movie.id}
                  onClick={() => onRemove(movie.id)}
                >
                  {removingMovieId === movie.id ? "Removing..." : "Remove"}
                </button>
              )}
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
            <p>TMDB details could not be loaded for movie {movieId}.</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default FavoriteMovieList;