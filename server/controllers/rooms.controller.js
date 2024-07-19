import HttpAppError from "../errors/app.error.js";
import {
  getValidPublicRoomId,
  getValidGeneratedRoomId,
} from "../websockets/handler.websocket.js";

export async function getPublicRoomId(req, res, next) {
  try {
    const publicRoomId = getValidPublicRoomId();
    res.send({ roomId: publicRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getIdForPrivateRoom(req, res, next) {
  try {
    const privateRoomId = getValidGeneratedRoomId();
    res.send({ roomId: privateRoomId });
  } catch (error) {
    next(error);
  }
}
