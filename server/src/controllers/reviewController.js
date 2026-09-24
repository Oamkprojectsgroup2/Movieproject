import pool from "../helper/db.js";

export const createReview = async (req,res) => {
    try {
        const {movieId, rating, reviewText} = req.body;
        const userId = req.user.user_id;     //Taken from authentication token

        //id or rating 0 would pass !rating, so null & undefined are checked instead
        if (movieId === undefined || movieId === null|| rating === undefined || rating === null) {
            return res.status(400).json({message: "MovieId and rating required"});
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({message: "Rating must be number between 1 and 5"});
        }

        const newReview = await pool.query(
            "INSERT INTO reviews (user_id, movies_tmdb_id, star, review) VALUES ($1, $2, $3, $4) RETURNING user_id, movies_tmdb_id, star, review",
            [userId, movieId, rating, reviewText]
        );

        return res.status(201).json({
            message: "Create review successful",
            review: newReview.rows[0],
        })
    }
    catch (error){
        //Code 23505 = PostgreSQL Unique Constraint Violation == review already exists
        if (error.code === "23505") {
            return res.status(409).json({message: "Review already exists"});
        }
        console.error("Review creation error: ", error);
        return res.status(500).json({message: "Review creation error"});
    }
};

export const viewReview = async (req,res) => {
    try {
        const {movieId} = req.params;

        if (!movieId) {
            return res.status(400).json({message: "Movie id required"});
        }

        const reviews = await pool.query(
            `SELECT 
            rev.review_id,
            rev.movies_tmdb_id,
            rev.user_id,
            rev.created_at,
            rev.star,
            rev.review,
            us.user_name
            FROM reviews rev JOIN users us ON rev.user_id = us.user_id
            WHERE rev.movies_tmdb_id = $1 ORDER BY rev.created_at DESC`, [movieId]
        );

        return res.status(200).json({count: reviews.rows.length, reviews: reviews.rows});
    }
    catch (error) {
        console.error("Review search error: ", error);
        return res.status(500).json({message: "Review search error"});
    }
};