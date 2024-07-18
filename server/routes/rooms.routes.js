import { Router } from "express";
import {
  getPublicRoomId,
  // getPrivateRoomId,
  // getRoomDetailsById,
} from "../controllers/rooms.controller.js";
const router = Router();

router.get("/get-public-room-id", getPublicRoomId);
// router.get("/get-private-room-id", getPrivateRoomId);
// router.get("/:roomId", getRoomDetailsById);

export default router;
