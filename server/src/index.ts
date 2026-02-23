import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.middleware";
import websocketHandler from "./websockets/handler.websocket";
import quizzesRoutes from "./routes/quizzes.routes";
import roomsRoutes from "./routes/rooms.routes";
import questionsRoutes from "./routes/questions.routes";
import optionsRoutes from "./routes/options.routes";
import mediaRoutes from "./routes/media.routes";
import { getRandomSimilarityQuestions } from "./controllers/questions.controller";
import "dotenv/config";

const app = express();
const server = http.createServer(app);

const allowedOrigins =
  process.env.NODE_ENV === "production" ? [process.env.CLIENT_URL as string] : "*";
const port = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
websocketHandler.setupWebSocketServer(wss); // Pass WebSocket server to handler

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins === "*") {
        callback(null, true);
      } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Use middlewares here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

// Use routes here
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/questions", questionsRoutes);
app.get("/api/similarity-questions", getRandomSimilarityQuestions);
app.use("/api/options", optionsRoutes);
app.use("/api/media", mediaRoutes);

app.use((_req, res) => {
  res.status(404).send("Page not found");
});

// Use error handler as the last middleware
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Quiz peers app listening on port ${port}`);
});

