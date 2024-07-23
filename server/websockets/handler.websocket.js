import {
  publicWaitingRooms,
  publicPlayingRooms,
  privateWaitingRooms,
  privatePlayingRooms
} from "../websockets/rooms.websocket.js";
import { handleChangePlayerName } from "./players.websocket.js";
import {
  handleLeaveWaitingRoom,
  handleJoinRoom
} from "../websockets/rooms.websocket.js";

let liveConnections = 0;

function setupWebSocketServer(wss) {
  wss.on("connection", (ws) => {
    liveConnections++;
    console.log("New WebSocket connection: ", liveConnections);
    try {
      ws.on("message", (message) => {
        const data = JSON.parse(message);
        console.log("Received: %s", data);
        switch (data?.event) {
          case "changePlayerName":
            handleChangePlayerName(ws, data);
            break;
          case "leaveWaitingRoom":
            handleLeaveWaitingRoom(ws, data);
            break;
          case "joinRoom":
            handleJoinRoom(ws, data);
            break;
          default:
            break;
        }
      });

      ws.on("close", () => {
        liveConnections--;
        console.log("WebSocket connection closed: ", liveConnections);
      });

      ws.on("error", (error) => {
        throw new Error(error);
      });
    } catch (error) {
      console.log(error);
      ws.send(JSON.stringify({ event: "error", message: error.message }));
    }
  });
}

export default {
  setupWebSocketServer
};
