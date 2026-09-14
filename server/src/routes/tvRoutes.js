import express from 'express';
import * as tvController from "../controllers/tvController.js";

const router = express.Router();

router.get("/search", tvController.search);
router.get("/top_rated", tvController.getTopRated);
router.get("/popular", tvController.getPopular);
router.get("/airing_today", tvController.getAiringToday);
router.get("/on_the_air", tvController.getOnTheAir);
router.get("/genres", tvController.getGenres);

export default router;