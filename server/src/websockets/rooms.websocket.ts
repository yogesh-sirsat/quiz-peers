import { generateRandomRoomId } from "../utils/rooms.utils.ts";
import { getGeneratePlayerName } from "./players.websocket.ts";
import HttpError from "../errors/app.error.ts";
import { getQuizQuestionsForPlay, updateQuizStats } from "../models/quiz.models.ts";
import { ExtendedWebSocket, WebSocketMessage } from "../interfaces/websocket.interface.ts";
import { QuizQuestion } from "../interfaces/quiz.interface.ts";

export interface PlayerState {
  ws: ExtendedWebSocket;
  playerName: string;
  readyToStart?: boolean;
  score: number;
  answeredCorrectly?: boolean;
  lastAnswerTime?: number;
}

export interface RoomMeta {
  isPublic: boolean;
  hostPeerId: string | null;
  quizId: number | null;
  isStarting: boolean;
  isAutoPlay: boolean;
}

export interface WaitingRoom extends Map<string, PlayerState> {
  meta: RoomMeta;
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

export interface PlayingSession {
  roomId: string;
  quizId: number;
  isRoomPublic: boolean;
  isAutoPlay: boolean;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  players: Map<string, PlayerState>;
  timer: NodeJS.Timeout | null;
  questionStartTime: number | null;
  questionStartedAt: number | null;
  questionTimeout: NodeJS.Timeout | null;
  interQuestionTimeout: NodeJS.Timeout | null;
  sessionTotalCorrect: number;
  sessionTotalPossible: number;
  currentAnswers: Map<string, { optionId: number; submittedAt: number }>;
  skipTimerVotes: Set<string>;
  questionDurationMs: number;
  interQuestionDelayMs: number;
}

export const publicWaitingRooms = new Map<string, WaitingRoom>();
export const publicPlayingRooms = new Map<string, PlayingSession>();
export const privateWaitingRooms = new Map<string, WaitingRoom>();
export const privatePlayingRooms = new Map<string, PlayingSession>();

const QUESTION_DURATION_MS = 15000;
const INTER_QUESTION_DELAY_MS = 3500;

function createWaitingRoomState(isPublic: boolean): WaitingRoom {
  const room = new Map<string, PlayerState>() as WaitingRoom;
  room.meta = {
    isPublic,
    hostPeerId: null,
    quizId: null,
    isStarting: false,
    isAutoPlay: false
  };
  return room;
}

function getWaitingRoom(roomId: string, isRoomPublic: boolean): WaitingRoom | undefined {
  return isRoomPublic ? publicWaitingRooms.get(roomId) : privateWaitingRooms.get(roomId);
}

function getPlayingRoomsMap(isRoomPublic: boolean): Map<string, PlayingSession> {
  return isRoomPublic ? publicPlayingRooms : privatePlayingRooms;
}

function getBasePointsForDifficulty(difficulty: string): number {
  if (difficulty === "Easy") {
    return 100;
  }
  if (difficulty === "Hard") {
    return 220;
  }
  return 150;
}

interface LeaderboardEntry {
  peerId: string;
  playerName: string;
  score: number;
}

function getLeaderboard(session: PlayingSession): LeaderboardEntry[] {
  return Array.from(session.players, ([peerId, player]) => ({
    peerId,
    playerName: player.playerName,
    score: player.score
  })).sort((a, b) => b.score - a.score);
}

function safeSend(ws: ExtendedWebSocket | undefined, payload: any): void {
  try {
    ws?.send(JSON.stringify(payload));
  } catch (error) {
    console.error(error);
  }
}

function broadcastPlayers(playersMap: Map<string, PlayerState>, payload: any): void {
  playersMap.forEach((player) => {
    safeSend(player?.ws, payload);
  });
}

function getWaitingRoomStatePayload(room: WaitingRoom, roomId: string): any {
  const roomPlayers = Array.from(room, ([peerId, value]) => ({
    peerId,
    playerName: value?.playerName,
    readyToStart: Boolean(value?.readyToStart)
  }));
  const readyPeerIds = roomPlayers.filter((player) => player.readyToStart).map((player) => player.peerId);
  return {
    event: "waitingRoomState",
    roomId,
    roomPlayers,
    readyPeerIds,
    totalPlayers: roomPlayers.length,
    hostPeerId: room.meta?.hostPeerId || null,
    isAutoPlay: room.meta?.isAutoPlay ?? true
  };
}

function emitWaitingRoomState(roomId: string, isRoomPublic: boolean): void {
  const room = getWaitingRoom(roomId, isRoomPublic);
  if (!room) {
    return;
  }
  const payload = getWaitingRoomStatePayload(room, roomId);
  broadcastPlayers(room, payload);
}

function emitPlayerLeftWaitingRoom(roomPlayers: WaitingRoom, peerId: string, playerName: string): void {
  try {
    roomPlayers.forEach((player) => {
      safeSend(player?.ws, {
        event: "playerLeftWaitingRoom",
        peerId,
        playerName
      });
    });
  } catch (e) {
    console.error(e);
  }
}

function beginNextQuestion(session: PlayingSession): void {
  const playingRooms = getPlayingRoomsMap(session.isRoomPublic) as Map<string, PlayingSession>;
  if (!playingRooms.has(session.roomId)) {
    return;
  }

  session.currentQuestionIndex += 1;

  if (session.currentQuestionIndex >= session.questions.length) {
    const leaderboard = getLeaderboard(session);
    broadcastPlayers(session.players, {
      event: "quizFinished",
      leaderboard,
      topThree: leaderboard.slice(0, 3)
    });

    if (process.env.NODE_ENV !== "development") {
      const totalPossible = session.sessionTotalPossible || 1; // avoid division by zero
      const successRate = (session.sessionTotalCorrect / totalPossible) * 100;
      updateQuizStats(session.quizId, session.players.size, successRate)
        .catch((e) => console.error("Failed to update quiz stats:", e));
    }

    playingRooms.delete(session.roomId);
    return;
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  session.questionStartedAt = Date.now();
  session.currentAnswers = new Map();
  session.skipTimerVotes = new Set();

  session.questionTimeout = setTimeout(() => {
    finalizeCurrentQuestion(session.roomId, session.isRoomPublic);
  }, session.questionDurationMs);

  broadcastPlayers(session.players, {
    event: "quizQuestion",
    questionIndex: session.currentQuestionIndex,
    totalQuestions: session.questions.length,
    questionDurationMs: session.questionDurationMs,
    questionStartedAt: session.questionStartedAt,
    questionEndsAt: (session.questionStartedAt || 0) + session.questionDurationMs,
    question: {
      questionId: currentQuestion.questionId,
      questionText: currentQuestion.questionText,
      imageUrl: currentQuestion.imageUrl,
      audioUrl: currentQuestion.audioUrl,
      difficulty: currentQuestion.difficulty,
      options: currentQuestion.options
    },
    leaderboard: getLeaderboard(session)
  });
}

function finalizeCurrentQuestion(roomId: string, isRoomPublic: boolean): void {
  const playingRooms = getPlayingRoomsMap(isRoomPublic) as Map<string, PlayingSession>;
  const session = playingRooms.get(roomId);
  if (!session) {
    return;
  }

  if (session.questionTimeout) clearTimeout(session.questionTimeout);
  session.skipTimerVotes.clear();

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const roundResults: any[] = [];

  session.sessionTotalPossible += session.players.size;

  session.players.forEach((player, peerId) => {
    const answer = session.currentAnswers.get(peerId);
    const selectedOptionId = answer?.optionId ?? null;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect && answer && session.questionStartedAt !== null) {
      session.sessionTotalCorrect += 1;
      const basePoints = getBasePointsForDifficulty(currentQuestion.difficulty);
      const elapsedMs = Math.max(0, Math.min(session.questionDurationMs, answer.submittedAt - session.questionStartedAt));
      const remainingRatio = Math.max(0, (session.questionDurationMs - elapsedMs) / session.questionDurationMs);
      // Diminishing-return utility bonus: reward speed without making late-correct answers worthless.
      speedBonus = Math.round(basePoints * 0.9 * Math.log2(1 + remainingRatio));
      pointsAwarded = basePoints + speedBonus;
      player.score += pointsAwarded;
    }

    roundResults.push({
      peerId,
      playerName: player.playerName,
      selectedOptionId,
      isCorrect,
      pointsAwarded,
      speedBonus,
      totalScore: player.score
    });
  });

  broadcastPlayers(session.players, {
    event: "questionResult",
    questionIndex: session.currentQuestionIndex,
    correctOptionId: currentQuestion.correctOptionId,
    results: roundResults,
    leaderboard: getLeaderboard(session),
    nextQuestionInMs: session.isAutoPlay ? session.interQuestionDelayMs : 0,
    isAutoPlay: session.isAutoPlay
  });

  if (session.isAutoPlay) {
    session.interQuestionTimeout = setTimeout(() => {
      beginNextQuestion(session);
    }, session.interQuestionDelayMs);
  }
}

async function startQuiz(roomId: string, isRoomPublic: boolean): Promise<void> {
  const waitingRoom = getWaitingRoom(roomId, isRoomPublic);
  if (!waitingRoom) {
    console.error(`startQuiz: Room ${roomId} not found (public: ${isRoomPublic})`);
    return;
  }
  if (waitingRoom.meta?.isStarting) {
    console.log(`startQuiz: Room ${roomId} is already starting`);
    return;
  }
  waitingRoom.meta.isStarting = true;

  try {
    const quizId = waitingRoom.meta?.quizId;
    if (quizId === null || quizId === undefined) {
      throw new Error("Quiz ID not found in room meta.");
    }
    console.log(`startQuiz: Fetching questions for quiz ${quizId}`);
    const questions = await getQuizQuestionsForPlay(quizId);

    if (!questions.length) {
      console.warn(`startQuiz: Quiz ${quizId} has no playable questions.`);
      broadcastPlayers(waitingRoom, {
        event: "quizStartFailed",
        message: "Quiz has no playable questions."
      });
      waitingRoom.meta.isStarting = false;
      return;
    }

    const players = new Map<string, PlayerState>();
    waitingRoom.forEach((player, peerId) => {
      players.set(peerId, {
        playerName: player.playerName,
        ws: player.ws,
        score: 0
      });
    });

    const session: PlayingSession = {
      roomId,
      quizId,
      isRoomPublic,
      isAutoPlay: waitingRoom.meta.isAutoPlay,
      players,
      questions,
      currentQuestionIndex: -1,
      currentAnswers: new Map(),
      questionDurationMs: QUESTION_DURATION_MS,
      interQuestionDelayMs: INTER_QUESTION_DELAY_MS,
      questionStartedAt: null,
      questionStartTime: null,
      questionTimeout: null,
      interQuestionTimeout: null,
      sessionTotalCorrect: 0,
      sessionTotalPossible: 0,
      skipTimerVotes: new Set(),
      timer: null
    };

    (getPlayingRoomsMap(isRoomPublic) as Map<string, PlayingSession>).set(roomId, session);
    if (isRoomPublic) {
      publicWaitingRooms.delete(roomId);
    } else {
      privateWaitingRooms.delete(roomId);
    }

    broadcastPlayers(players, {
      event: "quizStarted",
      roomId,
      totalQuestions: questions.length
    });

    beginNextQuestion(session);
  } catch (error) {
    console.error(error);
    broadcastPlayers(waitingRoom, {
      event: "quizStartFailed",
      message: "Could not start quiz right now."
    });
    waitingRoom.meta.isStarting = false;
  }
}

export function handleReadyToStart(ws: ExtendedWebSocket, data: any): void {
  try {
    const isRoomPublic = data?.isRoomPublic ?? true;
    const room = getWaitingRoom(data?.roomId, isRoomPublic);
    if (!room || !ws.playerId || !room.has(ws.playerId)) {
      safeSend(ws, { event: "readyToStartFailed", message: "Room not found." });
      return;
    }

    const player = room.get(ws.playerId)!;
    player.readyToStart = data?.readyToStart ?? true;
    room.set(ws.playerId, player);

    emitWaitingRoomState(data?.roomId, isRoomPublic);

    if (isRoomPublic) {
      const everyPlayerReady = Array.from(room.values()).every((roomPlayer) => roomPlayer.readyToStart);
      if (everyPlayerReady && room.size > 0) {
        startQuiz(data?.roomId, true);
      }
    }
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "readyToStartFailed", message: "Unable to update ready status." });
  }
}

export function handleStartPrivateQuiz(ws: ExtendedWebSocket, data: any): void {
  try {
    const room = getWaitingRoom(data?.roomId, false);
    if (!room) {
      safeSend(ws, { event: "startQuizFailed", message: "Room not found." });
      return;
    }
    if (room.meta?.hostPeerId !== ws.playerId) {
      safeSend(ws, { event: "startQuizFailed", message: "Only the quiz creator can start this private room." });
      return;
    }
    startQuiz(data?.roomId, false);
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "startQuizFailed", message: "Unable to start quiz." });
  }
}

export function handleSubmitAnswer(ws: ExtendedWebSocket, data: any): void {
  try {
    const playingRooms = getPlayingRoomsMap(data?.isRoomPublic) as Map<string, PlayingSession>;
    const session = playingRooms.get(data?.roomId);
    if (!session || !ws.playerId || !session.players.has(ws.playerId)) {
      safeSend(ws, { event: "submitAnswerFailed", message: "No active quiz session found." });
      return;
    }

    if (!session.questions[session.currentQuestionIndex]) {
      safeSend(ws, { event: "submitAnswerFailed", message: "No active question." });
      return;
    }

    session.currentAnswers.set(ws.playerId, {
      optionId: data?.optionId,
      submittedAt: Date.now()
    });
    safeSend(ws, { event: "answerAccepted", alreadyAnswered: false });
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "submitAnswerFailed", message: "Unable to submit answer." });
  }
}

export function handleSkipTimer(ws: ExtendedWebSocket, data: any): void {
  try {
    const playingRooms = getPlayingRoomsMap(data?.isRoomPublic) as Map<string, PlayingSession>;
    const session = playingRooms.get(data?.roomId);
    
    if (!session || !ws.playerId || !session.players.has(ws.playerId)) {
      return;
    }
    
    // Can only skip if question is active and user has answered
    if (!session.currentAnswers.has(ws.playerId)) {
      return;
    }

    session.skipTimerVotes.add(ws.playerId);
    
    broadcastPlayers(session.players, {
      event: "skipTimerUpdate",
      skipCount: session.skipTimerVotes.size,
      totalPlayers: session.players.size
    });

    if (session.skipTimerVotes.size === session.players.size) {
      finalizeCurrentQuestion(session.roomId, session.isRoomPublic);
    }
  } catch (error) {
    console.error(error);
  }
}

export function handleLeaveWaitingRoom(ws: ExtendedWebSocket): void {
  try {
    if (!ws?.roomId || !ws?.playerId) {
      return;
    }

    const waitingRoom = getWaitingRoom(ws.roomId, ws.isRoomPublic || false);
    if (waitingRoom?.has(ws.playerId)) {
      waitingRoom.delete(ws.playerId);
      emitPlayerLeftWaitingRoom(waitingRoom, ws.playerId, ws.playerName || "");

      if (!(ws.isRoomPublic || false) && waitingRoom.meta?.hostPeerId === ws.playerId) {
        const [nextHostPeerId] = waitingRoom.keys();
        waitingRoom.meta.hostPeerId = nextHostPeerId || null;
      }

      emitWaitingRoomState(ws.roomId, ws.isRoomPublic || false);
      return;
    }

    const playingRooms = getPlayingRoomsMap(ws.isRoomPublic || false) as Map<string, PlayingSession>;
    const session = playingRooms.get(ws.roomId);
    if (session?.players?.has(ws.playerId)) {
      session.players.delete(ws.playerId);
      session.currentAnswers.delete(ws.playerId);

      broadcastPlayers(session.players, {
        event: "playerLeftPlayingRoom",
        peerId: ws.playerId,
        playerName: ws.playerName,
        leaderboard: getLeaderboard(session)
      });

      if (session.players.size === 0) {
        if (session.questionTimeout) clearTimeout(session.questionTimeout);
        if (session.interQuestionTimeout) clearTimeout(session.interQuestionTimeout);
        playingRooms.delete(ws.roomId);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export function handleChangePlayerName(ws: ExtendedWebSocket, data: any): void {
  try {
    const room = getWaitingRoom(data?.roomId, data?.isRoomPublic);
    if (!room) {
      safeSend(ws, {
        event: "changePlayerNameFailed",
        responseCode: "ROOM NOT FOUND",
        message: "Oops! Room not found!"
      });
      return;
    }

    if (!ws.playerId || !room.has(ws.playerId)) {
      safeSend(ws, {
        event: "changePlayerNameFailed",
        responseCode: "PLAYER NOT FOUND",
        message: "Oops! Player not found!"
      });
      return;
    }

    let newName = data?.newName;
    if (data?.regenerate) {
      newName = getGeneratePlayerName(room);
    } else if (!newName) {
       safeSend(ws, {
        event: "changePlayerNameFailed",
        message: "No name provided."
      });
      return;
    }
    
    // Basic validation: ensure name isn't too long or empty
    if (newName.length > 50) {
      newName = newName.substring(0, 50);
    }

    const player = room.get(ws.playerId)!;
    player.playerName = newName;
    room.set(ws.playerId, player);
    ws.playerName = newName;

    safeSend(ws, {
      event: "playerNameChanged",
      success: true,
      newPlayerName: newName
    });

    emitWaitingRoomState(data?.roomId, data?.isRoomPublic);
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "changePlayerNameFailed", message: "Server error." });
  }
}

export function handleToggleAutoPlay(ws: ExtendedWebSocket, data: any): void {
  try {
    const isRoomPublic = data?.isRoomPublic ?? true;
    const room = getWaitingRoom(data?.roomId, isRoomPublic);
    if (!room || room.meta.hostPeerId !== ws.playerId) {
      return;
    }

    room.meta.isAutoPlay = Boolean(data?.isAutoPlay);
    emitWaitingRoomState(data?.roomId, isRoomPublic);
  } catch (error) {
    console.error(error);
  }
}

export function handleNextQuestion(ws: ExtendedWebSocket, data: any): void {
  try {
    const playingRooms = getPlayingRoomsMap(data?.isRoomPublic) as Map<string, PlayingSession>;
    const session = playingRooms.get(data?.roomId);
    if (!session || session.players.get(ws.playerId!)?.ws !== ws) {
      // In a real scenario, check if requester is the host
      return;
    }

    // Only allow if not auto-playing and currently between questions
    if (!session.isAutoPlay) {
      beginNextQuestion(session);
    }
  } catch (error) {
    console.error(error);
  }
}

export function handleJoinRoom(ws: ExtendedWebSocket, data: any): void {
  try {
    ws.playerId = data?.peerId;
    ws.roomId = data?.roomId;
    ws.isRoomPublic = data?.isRoomPublic;

    const room = data?.isRoomPublic ? publicWaitingRooms.get(data?.roomId) : privateWaitingRooms.get(data?.roomId);
    if (!room) {
      throw new Error("Oops, Room not found!");
    }
    room.meta.quizId = room.meta.quizId || data?.quizId;
    if (!room.meta.quizId) {
      room.meta.quizId = data?.quizId;
    }

    const playerName = getGeneratePlayerName(room);
    ws.playerName = playerName;
    room.set(data?.peerId, { playerName, ws, readyToStart: false, score: 0 });

    if (!data?.isRoomPublic && !room.meta?.hostPeerId) {
      room.meta.hostPeerId = data?.peerId;
    }

    safeSend(ws, {
      event: "joinRoomSuccess",
      playerName,
      isHost: room.meta?.hostPeerId === data?.peerId,
      hostPeerId: room.meta?.hostPeerId,
      roomPlayers: Array.from(room, ([key, value]) => ({
        peerId: key,
        playerName: value?.playerName,
        readyToStart: value?.readyToStart
      }))
    });
    emitWaitingRoomState(data?.roomId, data?.isRoomPublic);
  } catch (error: any) {
    console.error(error);
    safeSend(ws, { event: "joinRoomFailed", message: error.message });
  }
}

export function getRoomDetails(roomId: string): WaitingRoom | PlayingSession {
  if (publicWaitingRooms.has(roomId)) {
    return publicWaitingRooms.get(roomId)!;
  }
  if (publicPlayingRooms.has(roomId)) {
    return publicPlayingRooms.get(roomId)!;
  }
  if (privateWaitingRooms.has(roomId)) {
    return privateWaitingRooms.get(roomId)!;
  }
  if (privatePlayingRooms.has(roomId)) {
    return privatePlayingRooms.get(roomId)!;
  }
  throw new HttpError("Room not found", 404);
}

export function isRoomIdInUse(roomId: string): boolean {
  return (publicWaitingRooms.has(roomId) || privateWaitingRooms.has(roomId) || publicPlayingRooms.has(roomId) || privatePlayingRooms.has(roomId));
}

export function getValidGeneratedRoomId(isPublic: boolean = true, quizId: any = null): string {
  // Try 1 lackh times to find a room id that is not in use.
  let tries = 0;
  const lackh = 100000;
  while (tries < lackh) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      const roomState = createWaitingRoomState(isPublic);
      roomState.meta.quizId = quizId ? Number(quizId) : null;
      if (isPublic) {
        publicWaitingRooms.set(roomId, roomState);
      } else {
        privateWaitingRooms.set(roomId, roomState);
      }
      return roomId;
    }
    tries += 1;
  }

  if (isPublic) {
    throw new HttpError("No room found to join, please try again!", 404);
  }
  throw new HttpError("Could not create a private room, please try again!", 404);
}

export function getValidPublicRoomId(quizId: any = null): string {
  const qId = quizId ? Number(quizId) : null;
  for (const [key, value] of publicWaitingRooms) {
    if (value.size < 10 && (value.meta.quizId === qId || !value.meta.quizId)) {
      if (!value.meta.quizId) value.meta.quizId = qId;
      return key;
    }
  }
  return getValidGeneratedRoomId(true, qId);
}
