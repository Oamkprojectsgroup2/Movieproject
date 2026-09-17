import express from 'express';
import * as authController from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);


export default router;
