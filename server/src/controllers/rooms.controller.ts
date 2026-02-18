import { Request, Response, NextFunction } from "express";
import { getRoomDetails, getValidGeneratedRoomId, getValidPublicRoomId } from "../websockets/rooms.websocket.ts";

export async function getPublicRoomId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.query;
    const publicRoomId = getValidPublicRoomId(quizId as string);
    res.send({ roomId: publicRoomId });
  } catch (error) {
    next(error);
  }
}

export async function getIdForPrivateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.query;
    const privateRoomId = getValidGeneratedRoomId(false, quizId as string);
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
