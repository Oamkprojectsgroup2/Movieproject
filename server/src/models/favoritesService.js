import { randomUUID } from "node:crypto";
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

export const createShareToken = async (userId) => {
    const result = await pool.query(
        `UPDATE users
         SET shared_token = COALESCE(shared_token, $2)
         WHERE user_id = $1
         RETURNING shared_token`,
        [userId, randomUUID()],
    );

    return result.rows[0]?.shared_token ?? null;
};

export const getSharedFavorites = async (sharedToken) => {
    const result = await pool.query(
        `SELECT u.user_name,
                COALESCE(
                    json_agg(
                        json_build_object('movie_id', favorite.movies_tmdb_id)
                        ORDER BY favorite.movies_tmdb_id
                    ) FILTER (WHERE favorite.movies_tmdb_id IS NOT NULL),
                    '[]'::json
                ) AS favorites
         FROM users AS u
         LEFT JOIN favorite_movies AS favorite ON favorite.user_id = u.user_id
         WHERE u.shared_token = $1
         GROUP BY u.user_id, u.user_name`,
        [sharedToken],
    );

    return result.rows[0] ?? null;
};
