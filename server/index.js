import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import websocketHandler from "./websockets/handler.websocket.js";
import quizzesRoutes from "./routes/quizzes.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import optionsRoutes from "./routes/options.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import "dotenv/config";

const app = express();
const server = http.createServer(app);

const allowedOrigins =
  process.env.NODE_ENV === "production" ? [process.env.CLIENT_URL] : "*";
const port = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
websocketHandler.setupWebSocketServer(wss); // Pass WebSocket server to handler

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Use middlewares here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Use routes here
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/options", optionsRoutes);
app.use("/api/media", mediaRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Use error handler as the last middleware
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
