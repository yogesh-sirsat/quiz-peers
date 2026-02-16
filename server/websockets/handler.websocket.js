import {
  handleJoinRoom,
  handleLeaveWaitingRoom,
  handleReadyToStart,
  handleStartPrivateQuiz,
  handleSubmitAnswer,
  handleChangePlayerName,
  handleSkipTimer
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
