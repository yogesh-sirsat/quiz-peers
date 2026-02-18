import { WebSocketServer, RawData } from "ws";
import { ExtendedWebSocket, WebSocketMessage } from "../interfaces/websocket.interface.ts";
import {
  handleJoinRoom,
  handleLeaveWaitingRoom,
  handleReadyToStart,
  handleStartPrivateQuiz,
  handleSubmitAnswer,
  handleChangePlayerName,
  handleSkipTimer
} from "../websockets/rooms.websocket.ts";

let liveConnections = 0;

function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on("connection", (ws: ExtendedWebSocket) => {
    liveConnections++;
    console.log("New WebSocket connection: ", liveConnections);
    try {
      ws.on("message", (message: RawData) => {
        const data: WebSocketMessage = JSON.parse(message.toString());
        console.log("Received: %j", data);
        switch (data?.event) {
          case "changePlayerName":
            handleChangePlayerName(ws, data);
            break;
          case "leaveWaitingRoom":
            handleLeaveWaitingRoom(ws);
            break;
          case "joinRoom":
            handleJoinRoom(ws, data);
            break;
          case "readyToStart":
            handleReadyToStart(ws, data);
            break;
          case "startPrivateQuiz":
            handleStartPrivateQuiz(ws, data);
            break;
          case "submitAnswer":
            handleSubmitAnswer(ws, data);
            break;
          case "skipTimer":
            handleSkipTimer(ws, data);
            break;
          default:
            break;
        }
      });

      ws.on("close", () => {
        handleLeaveWaitingRoom(ws);
        liveConnections--;
        console.log("WebSocket connection closed: ", liveConnections);
      });

      ws.on("error", (error: Error) => {
        throw new Error(error.message);
      });
    } catch (error: any) {
      console.log(error);
      ws.send(JSON.stringify({ event: "error", message: error.message }));
    }
  });
}

export default {
  setupWebSocketServer
};
