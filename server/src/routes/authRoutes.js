import express from 'express';
import * as authController from "../controllers/authController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);
router.delete("/account", authenticate, authController.deleteAccount);


export default router;
