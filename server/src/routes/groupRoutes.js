import express from 'express';
import * as groupController from "../controllers/groupController.js";
import authenticate, { optionalAuthenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", optionalAuthenticate, groupController.listGroups);
router.get("/:groupId", authenticate, groupController.getGroupDetails);
router.post("/", authenticate, groupController.createGroup);
router.post("/:groupId/favorites", authenticate, groupController.addMovieToGroup);

export default router;