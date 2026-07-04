export type WebSocketEvent = 
  | 'changePlayerName'
  | 'leaveWaitingRoom'
  | 'joinRoom'
  | 'readyToStart'
  | 'startPrivateQuiz'
  | 'submitAnswer'
  | 'skipTimer'
  | 'error'
  | 'roomError'
  | 'joinRoomSuccess'
  | 'joinRoomFailed'
  | 'playerNameChanged'
  | 'playerLeftWaitingRoom'
  | 'waitingRoomState'
  | 'quizStarted'
  | 'quizStartFailed'
  | 'quizQuestion'
  | 'skipTimerUpdate'
  | 'answerAccepted'
  | 'questionResult'
  | 'playerLeftPlayingRoom'
  | 'quizFinished'
  | 'toggleAutoPlay'
  | 'nextQuestion';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data?: any;
  message?: string;
  [key: string]: any;
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
