import { Router } from "express";
import { getIdForPrivateRoom, getPublicRoomId, getRoomDetailsById } from "../controllers/rooms.controller.ts";

const router = Router();

router.get("/get-public-room-id", getPublicRoomId);
router.get("/get-id-for-private-room", getIdForPrivateRoom);
router.get("/:roomId", getRoomDetailsById);

export default router;
