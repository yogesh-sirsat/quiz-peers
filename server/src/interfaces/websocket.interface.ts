import { WebSocket } from 'ws';

export * from "@quiz-peers/shared";

export interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
  playerName?: string;
  isRoomPublic?: boolean;
  isAlive?: boolean;
}
