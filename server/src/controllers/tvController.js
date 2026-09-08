import * as tvService from "../models/tvService.js";

export const categoryRequest = (method, errorMessage) => async (req,res) => {
    try {
        const page = req.query.page || 1;
        const data = await method(page);
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
        const { query, page } = req.query;
        if (!query) {
            return res.status(400).json({message: "Search query is required" });
        }
        const data = await tvService.searchTvSeries(query, page);
        res.json(data);
    }
    catch (error) {
        console.error("Error searching series:", error)
        res.status(500).json({message: error.message || "Internal Server Error"});
    }
}