import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import websocketHandler from "./websockets/handler.websocket.js";
import cors from "cors";
import quizzesRoutes from "./routes/quizzes.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import "dotenv/config";

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  process.env.CLIENT_URL,
];
const port = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
websocketHandler.setupWebSocketServer(wss); // Pass WebSocket server to handler

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/quizzes", quizzesRoutes);
app.use("/api/rooms", roomsRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
