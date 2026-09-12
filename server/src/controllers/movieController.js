import * as movieService from "../models/moviesService.js";

export const categoryRequest = (method, errorMessage) => async (req,res) => {
    try {
        const page = req.query.page || 1;
        const language = req.query.language || "fi-FI";
        const region= req.query.region || "FI";
        const data = await method(page, language, region);
        res.json(data);
    }
    catch (error) {
        console.error(errorMessage, error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}

export const getNowPlaying = categoryRequest(
    movieService.getNowPlayingMovies,
    "Error fetching now playing movies:"
);

export const getPopular = categoryRequest(
    movieService.getPopularMovies,
    "Error fetching popular movies:"
);

export const getTopRated = categoryRequest(
    movieService.getTopRatedMovies,
    "Error fetching top rated movies:"
);

export const getUpcoming = categoryRequest(
    movieService.getUpcomingMovies,
    "Error fetching upcoming movies:"
);

export const search = async (req, res) => {
    try {
        const { query, page, language, region } = req.query;
        if (!query) {
            return res.status(400).json({message: "Search query is required" });
        }
        const data = await movieService.searchMovies(
            query,
            page || 1,
            language || "fi-FI",
            region || "FI"
            );
        res.json(data);
    }
    catch (error) {
        console.error("Error searching movies:", error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}

export const getGenres = async (req, res) => {
    try{
        const language = req.query.language || "fi-FI";
        const data = await movieService.getMovieGenres(language);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching movie genres:", error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}


