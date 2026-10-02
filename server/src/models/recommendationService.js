import pool from "../helper/db.js";
import { listFavorites } from "./favoritesService.js";
import {
  getMovieDetails,
  getPopularMovies,
  discoverMoviesByGenres,
  getMovieRecommendations,
} from "./moviesService.js";

const RESULT_LIMIT = 20;
const TOP_GENRE_COUNT = 3;
const MAX_FAVORITES_TO_SCAN = 20;
const MAX_PAGES = 5;
const MAX_SEED_FAVORITES = 10;


const shuffle = (items) => {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const getSimilarMovies = async (favoritesIds, excludedIds, language) => {
  const results = await Promise.allSettled(
    shuffle(favoritesIds)
      .slice(0, MAX_SEED_FAVORITES)
      .map((movieId) => getMovieRecommendations(movieId, 1, language)),
  );

  const scores = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    (result.value.results || []).forEach((movie, index) => {
      if (excludedIds.has(movie.id)) return;

      const points = 1 + (20 - index) / 40;
      const entry = scores.get(movie.id) || { movie, score: 0 };
      entry.score += points;
      scores.set(movie.id, entry);
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score || b.movie.popularity - a.movie.popularity)
    .slice(0, RESULT_LIMIT)
    .map(({ movie }) => movie);
};

const getExcludedMovieIds = async (userId, favoriteIds) => {
  const result = await pool.query(
    `SELECT movies_tmdb_id
    FROM reviews
    WHERE user_id = $1`,
    [userId]
  );

  return new Set([
    ...favoriteIds,
    ...result.rows.map((row) => row.movies_tmdb_id),
  ]);
};

const getTopGenreIds = async (favoritesIds, language) => {
  const results = await Promise.allSettled(
    favoritesIds
      .slice(0, MAX_FAVORITES_TO_SCAN)
      .map((movieId) => getMovieDetails(movieId, language)),
  );

  const genreCounts = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    for (const genre of result.value.genres || []) {
      genreCounts.set(genre.id, (genreCounts.get(genre.id) || 0) + 1);
    }
  }

  return [...genreCounts.entries()]
    .sort(([idA, countA], [idB, countB]) => countB - countA || idA - idB)
    .slice(0, TOP_GENRE_COUNT)
    .map(([genreId]) => genreId);
};

const collectMovies = async (fetchPage, excludedIds, picked) => {
  for (let page = 1; page <= MAX_PAGES && picked.length < RESULT_LIMIT; page++) {
    const data = await fetchPage(page);

    for (const movie of data.results || []) {
      if (picked.length >= RESULT_LIMIT) break;
      if (excludedIds.has(movie.id)) continue;
      if (picked.some((pickedMovie) => pickedMovie.id === movie.id)) continue;

      picked.push(movie);
    }

    if (page >= (data.total_pages || 1)) break;
  }

  return picked;
};

export const getRecommendations = async (userId, language = "fi-FI", region = "FI") => {
  const favorites = await listFavorites(userId);
  const favoriteIds = favorites.map((favorite) => favorite.movie_id);
  const excludedIds = await getExcludedMovieIds(userId, favoriteIds);

  const fetchPopularPage = (page) => getPopularMovies(page, language, region);

  if (favoriteIds.length === 0) {
    const results = await collectMovies(fetchPopularPage, excludedIds, []);
    return { type: "popular", results };
  }

  const picked = await getSimilarMovies(favoriteIds, excludedIds, language);

  if (picked.length < RESULT_LIMIT) {
    const genreIds = await getTopGenreIds(favoriteIds, language);
    if (genreIds.length > 0) {
      await collectMovies(
        (page) => discoverMoviesByGenres(genreIds, page, language, region),
        excludedIds,
        picked
      );
    }
  }

  if (picked.length < RESULT_LIMIT) {
    await collectMovies(fetchPopularPage, excludedIds, picked);
  }

  return { type: "recommended", results: picked };

};