import pool from "../helper/db.js";

export const listFavorites = async (userId) => {
    const result = await pool.query(
        `SELECT movies_tmdb_id AS movie_id
         FROM favorite_movies
         WHERE user_id = $1
         ORDER BY movies_tmdb_id`,
        [userId],
    );

    return result.rows;
};

export const addFavorite = async (userId, movieId) => {
    const result = await pool.query(
        `INSERT INTO favorite_movies (user_id, movies_tmdb_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, movies_tmdb_id) DO NOTHING
         RETURNING movies_tmdb_id AS movie_id`,
        [userId, movieId],
    );

    return result.rows[0] ?? null;
};

export const removeFavorite = async (userId, movieId) => {
    const result = await pool.query(
        `DELETE FROM favorite_movies
         WHERE user_id = $1 AND movies_tmdb_id = $2
         RETURNING movies_tmdb_id AS movie_id`,
        [userId, movieId],
    );

    return result.rows[0] ?? null;
};
