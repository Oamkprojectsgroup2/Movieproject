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

const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const createShareToken = async (req, res) => {
    try {
        const sharedToken = await favoritesService.createShareToken(req.user.user_id);

        if (sharedToken === null) {
            return res.status(404).json({ message: "User account not found" });
        }

        return res.status(200).json({ shared_token: sharedToken });
    } catch (error) {
        return handleError("share", error, res);
    }
};

export const getSharedFavorites = async (req, res) => {
    const { sharedToken } = req.params;

    if (!isUuid(sharedToken)) {
        return res.status(404).json({ message: "Favorite list not found" });
    }

    try {
        const favorites = await favoritesService.getSharedFavorites(sharedToken);

        if (favorites === null) {
            return res.status(404).json({ message: "Favorite list not found" });
        }

        return res.status(200).json(favorites);
    } catch (error) {
        return handleError("shared list", error, res);
    }
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