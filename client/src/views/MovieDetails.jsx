import { useState, useEffect , useCallback } from "react";
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
  const [formOpen, setFormOpen] = useState(false);
  const [formStar, setFormStar] = useState(0);
  const [formText, setFormText] = useState("");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const loadReviews = useCallback(async () => {
    try{
      const response = await fetch(`${BASE_URL}/reviews/search/${id}`);

      if(!response.ok) return;

      const data = await response.json();
      setReviews(data.reviews || []);
    }
    catch {
      // Commented to prevent error
    }
  }, [id]);


  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${BASE_URL}/movies/${id}?language=${siteLanguage}`         
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Movie not found");
        }

        if (cancelled) return;

        setMovie(data);
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

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  const myReview = user
    ? reviews.find((row) => row.user_id === user.user_id)
    : null;

  const sortedReviews = myReview
    ? [myReview, ...reviews.filter((row) => row !== myReview)]
    : reviews;

  const formatDate = (value) =>
    new Date(value).toLocaleString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  
  const openForm = () => {
    setFormStar(myReview?.star || 0);
    setFormText(myReview?.review || "");
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formStar) {
      setFormError("Select a rating first.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const text = formText.trim();

    try {
      const response = await fetch(
        `${BASE_URL}/reviews/${myReview ? "update" : "create"}`,
        {
          method: myReview ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            movieId: Number(id),
            rating: formStar,
            reviewText: myReview ? text : text || null,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Saving the review failed");
      }

      await loadReviews();
      setFormOpen(false);
    }
    catch (err) {
      setFormError(err.message);
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review?")) return;

    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch(`${BASE_URL}/reviews/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Deleting the review failed");
      }

      await loadReviews();
      setFormOpen(false);
    }
    catch (err) {
      setFormError(err.message);
    }
    finally {
      setSaving(false);
    }
  };

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
          
          <div>
            
            <h2>Reviews <span className="review-count">{reviewCount}</span></h2>

            {user && !formOpen && (
              <button type="button" className="btn-primary write-review" onClick={openForm}>
                {myReview ? "Edit your review" : "Write a review"}
              </button>
            )}

          </div>

          {formOpen && (
            <form className="review-form" onSubmit={handleSubmit}>

              <div className="review-form-top">
                <h3>Your review</h3>
                <span className="review-form-hint">Tap to rate</span>
              </div>
              
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((position) => (
                  <button
                    type="button"
                    key={position}
                    className={
                      position <= formStar
                        ? "star-button star-button-activate"
                        : "star-button"
                    }
                    onClick={() => setFormStar(position)}
                    aria-label={`${position} ${position === 1 ? "star" : "stars"}`}
                    aria-pressed={position === formStar}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className="review-form-textarea"
                value={formText}
                onChange={(event) => setFormText(event.target.value)}
                placeholder="What did you think?"
                rows={4}
                maxLength={2000}
              />

              {formError && (
                <p className="review-form-error">{formError}</p>
              )}

              <div className="review-form-actions">

                {myReview && (
                  <button
                    type="button"
                    className="review-delete"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Delete review
                  </button>
                )}

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !formStar}
                >
                  {saving ? "Saving..." : myReview ? "Save changes" : "Post review"}
                </button>

              </div>

            </form>
          )}
          
          {reviewCount === 0 ? (
            <p className="reviews-empty">
              No reviews yet.{" "}
              {user
                ? "Be the first to write one."
                : "log in to write the first one."}
            </p>
            
          ) : (

            <ul className="review-list">
              {sortedReviews.map((row) => (
                <li
                  className={row === myReview ? "review review-mine" : "review"}
                  key={row.review_id}
                >

                  <div className="review-top">
                    <span className="review-author">{row.user_name}</span>
                    <time className="review-date" dateTime={row.created_at}>
                      {formatDate(row.created_at)}
                    </time>
                  </div>

                  <Stars value={row.star} label={`${row.star} out of 5`}/>

                  {row.review && (
                    <p className="review-text">{row.review}</p>
                  )}

                </li>
              ))}
            </ul>

          )}
        </section>

      </div>
      
    </main>
  );
}

export default MovieDetails;