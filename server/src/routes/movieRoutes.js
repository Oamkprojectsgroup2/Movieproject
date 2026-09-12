import express from 'express';
import * as movieController from "../controllers/movieController.js";

const router = express.Router();

router.get("/nowplaying", movieController.getNowPlaying);
router.get("/search", movieController.search);
router.get("/popular", movieController.getPopular);
router.get("/top_rated", movieController.getTopRated);
router.get("/upcoming", movieController.getUpcoming)
router.get("/genres", movieController.getGenres)

export default router;