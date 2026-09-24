import * as favoritesService from "../models/favoritesService.js";

const parseMovieId = (value) => {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
        return value;
    }

    return null;
};

const handleError = (operation, error, res) => {
    console.error(`Favorite movies ${operation} error:`, error);
    return res.status(500).json({ message: "Favorite movies error" });
};

export const listFavorites = async (req, res) => {
    try {
        const favorites = await favoritesService.listFavorites(req.user.user_id);
        return res.status(200).json({ favorites });
    } catch (error) {
        return handleError("list", error, res);
    }
};

export const addFavorite = async (req, res) => {
    const movieId = parseMovieId(req.body?.movie_id);

    if (movieId === null) {
        return res.status(400).json({ message: "movie_id must be a positive integer" });
    }

    try {
        const favorite = await favoritesService.addFavorite(req.user.user_id, movieId);

        if (favorite === null) {
            return res.status(200).json({
                message: "Movie is already in favorites",
                favorite: { movie_id: movieId },
            });
        }

        return res.status(201).json({ favorite });
    } catch (error) {
        return handleError("add", error, res);
    }
};

export const removeFavorite = async (req, res) => {
    const movieId = Number(req.params.movieId);

    if (!Number.isSafeInteger(movieId) || movieId <= 0) {
        return res.status(400).json({ message: "movie_id must be a positive integer" });
    }

    try {
        await favoritesService.removeFavorite(req.user.user_id, movieId);
        return res.status(204).send();
    } catch (error) {
        return handleError("remove", error, res);
    }
};