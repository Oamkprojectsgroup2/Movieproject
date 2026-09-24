import express from "express";
import * as favoritesController from "../controllers/favoritesController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticate);
router.get("/", favoritesController.listFavorites);
router.post("/", favoritesController.addFavorite);
router.delete("/:movieId", favoritesController.removeFavorite);

export default router;