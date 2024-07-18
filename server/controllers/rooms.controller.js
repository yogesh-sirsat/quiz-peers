import { generateRandomRoomId } from "../utils/rooms.utils.js";
import { getValidPublicRoomId } from "../websockets/handler.websocket.js";

export async function getPublicRoomId(req, res) {
  try {
    const publicRoomId = await getValidPublicRoomId();
    res.send({ roomId: publicRoomId });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
