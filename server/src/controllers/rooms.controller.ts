import { Request, Response, NextFunction } from "express";
import { getRoomDetails, getValidGeneratedRoomId, getValidPublicRoomId } from "../websockets/rooms.websocket.ts";
import { GameMode } from "../interfaces/question.interface.ts";

function normalizeMode(mode: unknown): GameMode {
  return mode === "SIMILARITY" ? "SIMILARITY" : "TRIVIA";
}

export async function getPublicRoomId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId, mode, similarityQuestionCount } = req.query;
    const publicRoomId = getValidPublicRoomId(
      quizId as string,
      normalizeMode(mode),
      Number(similarityQuestionCount || 10)
    );
    res.send({ roomId: publicRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getIdForPrivateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId, mode, similarityQuestionCount } = req.query;
    const privateRoomId = getValidGeneratedRoomId(
      false,
      quizId as string,
      normalizeMode(mode),
      Number(similarityQuestionCount || 10)
    );
    res.send({ roomId: privateRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getRoomDetailsById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const roomDetails = getRoomDetails(roomId as string);
    res.send({ ...roomDetails });
  } catch (error) {
    next(error);
  }
}
