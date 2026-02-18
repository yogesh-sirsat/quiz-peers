import { WebSocket } from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
  playerName?: string;
  isRoomPublic?: boolean;
  isAlive?: boolean;
}

export type WebSocketEvent = 
  | 'changePlayerName'
  | 'leaveWaitingRoom'
  | 'joinRoom'
  | 'readyToStart'
  | 'startPrivateQuiz'
  | 'submitAnswer'
  | 'skipTimer'
  | 'error';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data?: any;
  message?: string;
}

export interface JoinRoomData {
  roomId: string;
  playerName: string;
  playerId?: string;
}

export interface ChangePlayerNameData {
  playerName: string;
}

export interface SubmitAnswerData {
  optionId: number;
  questionId: number;
}
