const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export const tmdbFetch = async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${TMDB_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
