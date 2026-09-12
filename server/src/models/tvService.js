import { tmdbFetch } from '../helper/tmdb.js';

export const searchTvSeries = (query, page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/search/tv", {query, page, language, region});
}

export const getPopularTvSeries = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/tv/popular", {page, language, region});
}

export const getTopRatedTvSeries = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/tv/top_rated", {page, language, region});
}

export const getAiringTodayTvSeries = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/tv/airing_today", {page, language, region});
}

export const getOnTheAirTvSeries  = (page = 1, language = "fi-FI", region = "FI") => {
    return tmdbFetch("/tv/on_the_air", {page, language, region});
}

export const getTvGenres = (language = "fi-FI") => {
    return tmdbFetch("/genre/tv/list", {language});
}