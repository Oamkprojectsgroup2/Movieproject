import { tmdbFetch } from '../helper/tmdb.js';

export const searchMovies = (query, page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/search/movie", {query, page, language, region});
}

export const getNowPlayingMovies = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/movie/now_playing", {page, language, region});
}

export const getPopularMovies = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/movie/popular", {page, language, region});
}

export const getTopRatedMovies = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/movie/top_rated", {page, language, region});
}

export const getUpcomingMovies = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/movie/upcoming", {page, language, region});
}

export const getMovieGenres = (language = "fi-FI") => {
    return tmdbFetch("/genre/movie/list", {language});
}