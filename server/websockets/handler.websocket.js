import { generateRandomRoomId } from "../utils/rooms.utils.js";
import HttpError from "../errors/app.error.js";

const publicWaitingRooms = new Map();
const publicPlayingRooms = new Map();
const privateWaitingRooms = new Map();
const privatePlayingRooms = new Map();

function setupWebSocketServer(wss) {
  wss.on("connection", function connection(ws) {
    console.log("New WebSocket connection");

    ws.on("message", function incoming(message) {
      console.log("Received: %s", message);
      ws.send("Echo: " + message);
    });
  });
}

export function isRoomIdInUse(roomId) {
  return (
    publicWaitingRooms.has(roomId) ||
    privateWaitingRooms.has(roomId) ||
    publicPlayingRooms.has(roomId) ||
    privatePlayingRooms.has(roomId)
  );
}

export function getValidGeneratedRoomId(isPublic = true) {
  // Try 1000 times to find a room id that is not in use yet
  let tries = 0;
  while (tries < 1) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      return roomId;
    }
    tries += 1;
  }
  if (isPublic) {
    throw new HttpError("No room found to join, please try again!", 404);
  }
  throw new HttpError(
    "Could not create a private room, please try again!",
    404
  );
}

export function getValidPublicRoomId() {
  for (const [key, value] of publicWaitingRooms) {
    if (value.size < 10) {
      return key;
    }
  }
  return getValidGeneratedRoomId();
}

export default {
  setupWebSocketServer,
};
