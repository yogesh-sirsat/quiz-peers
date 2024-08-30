import { getRoomDetails, getValidGeneratedRoomId, getValidPublicRoomId } from "../websockets/rooms.websocket.js";

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
    const privateRoomId = getValidGeneratedRoomId(false);
    res.send({ roomId: privateRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getRoomDetailsById(req, res, next) {
  try {
    const { roomId } = req.params;
    const roomDetails = getRoomDetails(roomId);
    res.send({ ...roomDetails });
  } catch (error) {
    next(error);
  }
}
