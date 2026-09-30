import "./styles/MovieRatings.css";
import Stars from "./Stars";
import { tmdbToFive } from "../utils/ratings";

function MovieRatings({ voteAverage, cineCircle }) {
  const tmdb = tmdbToFive(voteAverage);
  return (
    <div className="movie-ratings-compact">
      <div><span className="rating-source">TMDB</span> <Stars value={tmdb} /></div>
      <div>
        <span className="rating-source">CineCircle</span>{" "}
        {cineCircle ? <Stars value={cineCircle.average} /> : <span className="rating-empty-text">No reviews</span>}
      </div>
    </div>
  );
}

export default MovieRatings;