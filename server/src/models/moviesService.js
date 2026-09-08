import { tmdbFetch } from '../helper/tmdb.js';

export const getNowPlayingMovies = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/movie/now_playing", {page, language});
}

export const getPopularMovies = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/movie/popular", {page, language});
}

export const searchMovies = (query, page = 1) => {
    return tmdbFetch("/search/movie", {query, page});
}

export const getTopRatedMovies = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/movie/top_rated", {page, language});
}

export const getUpcomingMovies = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/movie/upcoming", {page, language});
}