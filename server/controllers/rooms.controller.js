import { getRoomDetails, getValidGeneratedRoomId, getValidPublicRoomId } from "../websockets/rooms.websocket.js";

export async function getPublicRoomId(req, res, next) {
  try {
    const { quizId } = req.query;
    const publicRoomId = getValidPublicRoomId(quizId);
    res.send({ roomId: publicRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getIdForPrivateRoom(req, res, next) {
  try {
    const { quizId } = req.query;
    const privateRoomId = getValidGeneratedRoomId(false, quizId);
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
