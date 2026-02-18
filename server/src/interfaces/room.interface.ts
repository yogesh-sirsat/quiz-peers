import { ExtendedWebSocket } from './websocket.interface.ts';
import { QuizQuestion } from './quiz.interface.ts';

export interface RoomMeta {
  isPublic: boolean;
  hostPeerId: string | null;
  quizId: number | null;
  isStarting: boolean;
}

export interface PlayerState {
  ws: ExtendedWebSocket;
  playerName: string;
  readyToStart?: boolean;
  score?: number;
  answeredCorrectly?: boolean;
  lastAnswerTime?: number;
}

export interface WaitingRoom extends Map<string, PlayerState> {
  meta?: RoomMeta;
}

export interface PlayingRoom {
  quizId: number;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  players: Map<string, PlayerState>;
  timer: NodeJS.Timeout | null;
  questionStartTime: number;
  isPublic: boolean;
}
