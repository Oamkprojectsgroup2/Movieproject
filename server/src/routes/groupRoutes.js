import express from 'express';
import * as groupController from "../controllers/groupController.js";
import authenticate, { optionalAuthenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", optionalAuthenticate, groupController.listGroups);
router.post("/", authenticate, groupController.createGroup);
router.post("/join/:groupId", authenticate, groupController.joinGroup);
router.get("/pending/:groupId", authenticate, groupController.pendingMembers);
router.put("/accept/:groupId/:userId", authenticate, groupController.memberAccept);
router.put("/reject/:groupId/:userId", authenticate, groupController.memberReject);

export default router;
