import { QuizDTO } from '../quiz/quiz.types';
import { GameMode } from '../question/question.types';

export interface Room {
  room_id: string;
  quiz_id: number | null;
  mode?: GameMode;
  similarityQuestionCount?: number;
  room_type?: 'public' | 'private';
  created_at?: string | Date;
}

export interface RoomDetails extends Room {
  quiz: QuizDTO;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface RoomPlayer {
  peerId: string;
  name?: string;
  playerName?: string;
  isMute?: boolean;
  isLocal?: boolean;
  score?: number;
  readyToStart?: boolean;
  [key: string]: any;
}

export interface LeaderboardEntry {
  peerId: string;
  playerName: string;
  score: number;
}
