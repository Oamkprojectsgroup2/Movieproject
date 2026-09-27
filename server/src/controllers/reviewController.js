import pool from "../helper/db.js";

export const createReview = async (req,res) => {
    try {
        const {movieId, rating, reviewText} = req.body;
        const userId = req.user.user_id;     //Taken from authentication token

        //id or rating 0 would pass !rating, so null & undefined are checked instead
        if (!/^\d+$/.test(movieId) || rating === undefined || rating === null) {
            return res.status(400).json({message: "MovieId and rating required"});
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({message: "Rating must be number between 1 and 5"});
        }

        const newReview = await pool.query(
            `INSERT INTO reviews (user_id, movies_tmdb_id, star, review) VALUES ($1, $2, $3, $4)
            RETURNING user_id, movies_tmdb_id, star, review`,
            [userId, movieId, rating, reviewText]
        );

        return res.status(201).json({
            message: "Create review successful",
            review: newReview.rows[0],
        });
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

        if (!/^\d+$/.test(movieId)) {
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

export const updateReview = async (req,res) => {
    try {
        const {movieId, rating, reviewText} = req.body;
        const userId = req.user.user_id;

        if (!/^\d+$/.test(movieId) || rating === undefined || rating === null) {
            return res.status(400).json({message: "MovieId and rating required"});
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({message: "Rating must be number between 1 and 5"});
        }

        //Checks in incoming text is either undefine or empty
        const textToUpdate = (reviewText !== undefined && reviewText.trim() !== "") ? reviewText : null;

        const updateReview = await pool.query(
            `UPDATE reviews SET star = $1, review = COALESCE($2, review)
            WHERE user_id = $3 AND movies_tmdb_id = $4 RETURNING user_id, movies_tmdb_id, star, review`,
            [rating, textToUpdate, userId, movieId]
        );

        if (updateReview.rowCount === 0) {
            return res.status(404).json({message: "Review not found"});
        }

        return res.status(200).json({
        message: "Update review successful",
        review: updateReview.rows[0],
        });
    }
    catch (error) {
        console.error("Review modify error: ", error);
        return res.status(500).json({message: "Review modify error"});
    }
};

export const deleteReview = async (req,res) => {
    try {
        const {movieId} = req.params;
        const userId = req.user.user_id;

        if (!/^\d+$/.test(movieId)) {
            return res.status(400).json({message: "Valid MovieId required"});
        }

        const deleteReview = await pool.query(
            "DELETE FROM reviews WHERE user_id = $1 AND movies_tmdb_id = $2", [userId, movieId]
        );

        if (deleteReview.rowCount === 0) {
            return res.status(404).json({message: "Review not found"});
        }

        return res.status(200).json({message: "Delete review successful"});
    }
    catch (error) {
        console.error("Review delete error: ", error);
        return res.status(500).json({message: "Review delete error"});
    }
};

export const listMyReviews = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const reviews = await pool.query(
      `SELECT review_id, movies_tmdb_id, created_at, star, review
      FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`, [userId]
    );

    return res.status(200).json({count: reviews.rows.length, reviews: reviews.rows});
  }
  catch (error) {
    console.error("Own reviews error: ", error);
    return res.status(500).json({message: "Own reviews error"});
  }
};