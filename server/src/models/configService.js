import { tmdbFetch } from '../helper/tmdb.js';

export const getLanguage = () => {
    return tmdbFetch("/configuration/languages");
};
