import express from 'express';
import * as groupController from "../controllers/groupController.js";
import authenticate, { optionalAuthenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", optionalAuthenticate, groupController.listGroups);
router.get("/:groupId", authenticate, groupController.getGroupDetails);
router.post("/", authenticate, groupController.createGroup);
router.get("/membership/:groupId", authenticate, groupController.myStatus);
router.post("/join/:groupId", authenticate, groupController.joinGroup);
router.get("/memberList/:groupId", authenticate, groupController.memberList);
router.put("/accept/:groupId/:userId", authenticate, groupController.memberAccept);
router.put("/reject/:groupId/:userId", authenticate, groupController.memberReject);
router.delete("/remove/:groupId/:userId", authenticate, groupController.memberRemove);
router.post("/:groupId/favorites", authenticate, groupController.addMovieToGroup);
router.delete("/:groupId/favorites/:movieId", authenticate, groupController.removeMovieFromGroup);
router.delete('/:groupId', authenticate, groupController.deleteGroup);

export default router;

