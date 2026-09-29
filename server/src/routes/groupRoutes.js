import express from 'express';
import * as groupController from "../controllers/groupController.js";
import authenticate, { optionalAuthenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", optionalAuthenticate, groupController.listGroups);
router.post("/", authenticate, groupController.createGroup);

export default router;