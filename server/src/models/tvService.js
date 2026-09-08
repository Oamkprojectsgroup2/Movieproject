import { tmdbFetch } from '../helper/tmdb.js';

export const searchTvSeries = (query, page = 1, language = "fi-FI") => {
    return tmdbFetch("/search/tv", {query, page, language});
}

export const getPopularTvSeries = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/tv/popular", {page, language});
}

export const getTopRatedTvSeries = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/tv/top_rated", {page, language});
}

export const getAiringTodayTvSeries = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/tv/airing_today", {page, language});
}

export const getOnTheAirTvSeries  = (page = 1, language = "fi-FI") => {
    return tmdbFetch("/tv/on_the_air", {page, language});
}