import pool from "../helper/db.js";

export const createReview = async (req,res) => {
    try {
        const {movieId, rating, reviewText} = req.body;
        const userId = req.user.user_id;     //Taken from authentication token

        if (!movieId || !rating || !reviewText) {
            return res.status(400).json({message: "MovieId, rating and review text required."});
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({message: "Rating must be between 1 and 5."});
        }

        const newReview = await pool.query(
            "INSERT INTO reviews (user_id, movies_tmdb_id, star, review) VALUES ($1, $2, $3, $4) RETURNING user_id, movies_tmdb_id, star, review",
            [userId, movieId, rating, reviewText]
        );

        return res.status(201).json({
            message: "Create review succesful",
            review: newReview.rows[0],
        })
    }
    catch (error){
        console.error("Review creation error: ", error);
        return res.status(500).json({message: "Review creation error"})
    }
};