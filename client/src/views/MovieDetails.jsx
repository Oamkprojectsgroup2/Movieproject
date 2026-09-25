import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { BASE_URL } from "../config";
import Stars from "../components/Stars";
import "./styles/MovieDetails.css";

function MovieDetails({ user, siteLanguage}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [movieResponse, reviewResponse] = await Promise.all([
          fetch(`${BASE_URL}/movies/${id}?language=${siteLanguage}`),
          fetch(`${BASE_URL}/reviews/search/${id}`),         
        ]);

        const movieData = await movieResponse.json();

        if (!movieResponse.ok) {
          throw new Error(movieData.message || "Movie not found");
        }

        const reviewData = await reviewResponse
          .json()
          .catch(() => ({ reviews: [] }));

        if (cancelled) return;

        setMovie(movieData);
        setReviews(reviewResponse.ok ? reviewData.reviews || [] : []);
      }
      catch (err) {
        if (!cancelled) setError(err.message);
      }
      finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [id, siteLanguage]);

  if (loading) {
    return <main className="movie-details"><p>Loading...</p></main>;
  }

  if (error) {
    return (
      <main className="movie-details">
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back to results
        </button>
        <h2>{error}</h2>
      </main>
    );
  }

  const reviewCount = reviews.length;

  const reviewAverage = reviewCount
    ? reviews.reduce((sum, row) => sum + row.star, 0) /reviewCount
    : null;

  const tmdbAverage = movie.vote_average ? movie.vote_average / 2 : null;

  const director = movie.credits?.crew?.find(
    (person) => person.job === "Director"
  )?.name;

  const genreNames = (movie.genres || [])
    .map((genre) => genre.name)
    .join(", ");

  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : null;

  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)} h ${movie.runtime % 60} min`
    : null;

  const spokenLanguage = 
    movie.spoken_languages?.[0]?.english_name ||
    movie.original_language?.toUpperCase();

  return (
    <main className="movie-details">
      <div className="movie-details-container">

        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back to results
        </button>

        <div className="movie-header">

          <div className="details-poster">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={`${movie.title} poster`}
              />
            ) : (
              <span>No poster</span>
            )}
          </div>

          <div className="details-info">

            <h1>{movie.title}</h1>
            <p className="movie-subline">
              {[releaseYear, runtime].filter(Boolean).join(" · ")}
            </p>

            <div className="movie-ratings">

              <div className="rating-block">
                <span className="rating-source">TMDB</span>
                <Stars
                  value={tmdbAverage}
                  label={`TMDB rating ${tmdbAverage?.toFixed(1) ?? "unrated"} out of 5`}
                />
                <span className="rating-value">
                  {tmdbAverage ? tmdbAverage.toFixed(1) : "-"}
                  <span className="rating-count">
                    {" · "}{movie.vote_count || 0} votes
                  </span>
                </span>
              </div>

              <div className="rating-block">
                <span className="rating-source">CineCircle</span>
                
                {reviewAverage ? (
                  <>
                    <Stars
                      value={reviewAverage}
                      label={`CineCircle rating ${reviewAverage?.toFixed(1) ?? "unrated"} out of 5`}
                    />
                    <span className="rating-value">
                      {reviewAverage ? reviewAverage?.toFixed(1) : "-"}
                      <span className="rating-count">
                        {" · "}{reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="details-rating-empty">No reviews yet</span>
                )}
              </div>

            </div>

            <dl className="movie-meta">
              <dt>Genre</dt>
              <dd>{genreNames || "N/A"}</dd>

              <dt>Director</dt>
              <dd>{director || "N/A"}</dd>

              <dt>Language</dt>
              <dd>{spokenLanguage || "N/A"}</dd>
            </dl>

            {movie.overview && (
              <p className="movie-overview">{movie.overview}</p>
            )}
            
            {/* when user logged in */}

            {user && (
              <div className="movie-actions">
                <button type="button" className="btn-outline">
                  ♡ Add to favourites
                </button>
                <button type="button" className="btn-outline">
                  Add to group
                </button>
              </div>
            )}

          </div>

        </div>
        
        <section className="movie-reviews">
          <h2>Reviews <span className="review-count">{reviewCount}</span></h2>
        </section>

      </div>
      
    </main>
  );
}

export default MovieDetails;