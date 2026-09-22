import express from 'express';
import * as reviewController from "../controllers/reviewController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.post("/create", authenticate, reviewController.createReview);

export default router;