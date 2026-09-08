import * as movieService from "../models/moviesService.js";

export const getNowPlaying = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const data = await movieService.getNowPlayingMovies(page);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching now playing movies:", error)
        res.status(500).json({error: "Failed to fetch movies"});
    }
}

export const search = async (req, res) => {
    try {
        const { query, page } = req.query;
        if (!query) {
            return res.status(400).json({error: "Search query is required"});
        }
        const data = await movieService.searchMovies(query, page);
        res.json(data);
    }
    catch (error) {
        console.error("Error searching movies:", error)
        res.status(500).json({error: "Failed to search movies"});
    }
}

export const getPopular = async (req,res) => {
    try {
        const page = req.query.page || 1;
        const data = await movieService.getPopularMovies(page);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching popular movies:", error)
        res.status(500).json({error: "Failed to fetch movies"});
    }
}

export const getTopRated = async (req,res) => {
    try {
        const page = req.query.page || 1;
        const data = await movieService.getTopRatedMovies(page);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching top rated movies:", error)
        res.status(500).json({error: "Failed to fetch movies"});
    }
}

export const getUpcoming = async (req,res) => {
    try {
        const page = req.query.page || 1;
        const data = await movieService.getUpcomingMovies(page);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching upcoming movies:", error)
        res.status(500).json({error: "Failed to fetch movies"});
    }
}