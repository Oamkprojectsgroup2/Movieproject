import * as tvService from "../models/tvService.js";

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

export const getPopular = categoryRequest(
    tvService.getPopularTvSeries,
    "Error fetching popular tv series:"
);

export const getTopRated = categoryRequest(
    tvService.getTopRatedTvSeries,
    "Error fetching top rated tv series:"
);

export const getAiringToday = categoryRequest(
    tvService.getAiringTodayTvSeries,
    "Error fetching airing today tv series:"
);

export const getOnTheAir = categoryRequest(
    tvService.getOnTheAirTvSeries,
    "Error fetching on the air tv series:"
);

export const search = async (req, res) => {
    try {
        const { query, page, language, region } = req.query;
        if (!query) {
            return res.status(400).json({message: "Search query is required" });
        }
        const data = await tvService.searchTvSeries(query,
            page || 1,
            language || "fi-FI",
            region || "FI"
            );
        res.json(data);
    }
    catch (error) {
        console.error("Error searching series:", error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}

export const getGenres = async (req, res) => {
    try{
        const language = req.query.language || "fi-FI";
        const data = await tvService.getTvGenres(language);
        res.json(data);
    }
    catch (error) {
        console.error("Error fetching tv genres:", error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}
