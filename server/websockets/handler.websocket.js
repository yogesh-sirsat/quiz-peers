import { generateRandomRoomId } from "../utils/rooms.utils.js";

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

export async function getValidPublicRoomId() {
  for (const [key, value] of publicWaitingRooms) {
    if (value.size < 10) {
      return key;
    }
  }
  while (true) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      return roomId;
    }
  }
}

export async function isRoomIdInUse(roomId) {
  return (
    publicWaitingRooms.has(roomId) ||
    privateWaitingRooms.has(roomId) ||
    publicPlayingRooms.has(roomId) ||
    privatePlayingRooms.has(roomId)
  );
}

export default {
  setupWebSocketServer,
};
