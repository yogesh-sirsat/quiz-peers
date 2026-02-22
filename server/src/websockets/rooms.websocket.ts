import { generateRandomRoomId } from "../utils/rooms.utils.ts";
import { getGeneratePlayerName } from "./players.websocket.ts";
import HttpError from "../errors/app.error.ts";
import { getQuizQuestionsForPlay, updateQuizStats } from "../models/quiz.models.ts";
import { getRandomSimilarityQuestionsData } from "../models/questions.models.ts";
import { ExtendedWebSocket } from "../interfaces/websocket.interface.ts";
import { QuizQuestion } from "../interfaces/quiz.interface.ts";
import { GameMode, SimilaritySessionResult } from "../interfaces/question.interface.ts";

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
  mode: GameMode;
  similarityQuestionCount: number;
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
  quizId: number | null;
  mode: GameMode;
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
  answerHistory: Map<number, Map<string, number | null>>;
  skipTimerVotes: Set<string>;
  awaitingManualAdvance: boolean;
  questionDurationMs: number;
  interQuestionDelayMs: number;
}

export const publicWaitingRooms = new Map<string, WaitingRoom>();
export const publicPlayingRooms = new Map<string, PlayingSession>();
export const privateWaitingRooms = new Map<string, WaitingRoom>();
export const privatePlayingRooms = new Map<string, PlayingSession>();

const QUESTION_DURATION_MS = 15000;
const INTER_QUESTION_DELAY_MS = 3500;

function createWaitingRoomState(isPublic: boolean, mode: GameMode = "TRIVIA", similarityQuestionCount = 10): WaitingRoom {
  const room = new Map<string, PlayerState>() as WaitingRoom;
  room.meta = {
    isPublic,
    hostPeerId: null,
    quizId: null,
    mode,
    similarityQuestionCount: Math.max(1, Math.min(20, similarityQuestionCount || 10)),
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

function getSessionLeaderboard(session: PlayingSession): LeaderboardEntry[] {
  if (session.mode === "SIMILARITY") {
    return [];
  }
  return getLeaderboard(session);
}

function computeSimilarityInsights(session: PlayingSession): SimilaritySessionResult {
  const players = Array.from(session.players, ([peerId, player]) => ({
    peerId,
    playerName: player.playerName
  }));

  const pairwise: SimilaritySessionResult["pairwise"] = [];
  const perPlayerSimilarity: SimilaritySessionResult["perPlayerSimilarity"] = {};

  players.forEach((player) => {
    perPlayerSimilarity[player.peerId] = [];
  });

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i];
      const playerB = players[j];
      let similarityCount = 0;

      session.answerHistory.forEach((answersForQuestion) => {
        const a = answersForQuestion.get(playerA.peerId);
        const b = answersForQuestion.get(playerB.peerId);
        if (a !== null && a !== undefined && b !== null && b !== undefined && a === b) {
          similarityCount += 1;
        }
      });

      pairwise.push({
        playerAId: playerA.peerId,
        playerAName: playerA.playerName,
        playerBId: playerB.peerId,
        playerBName: playerB.playerName,
        similarityCount
      });

      perPlayerSimilarity[playerA.peerId].push({
        peerId: playerB.peerId,
        playerName: playerB.playerName,
        similarityCount
      });
      perPlayerSimilarity[playerB.peerId].push({
        peerId: playerA.peerId,
        playerName: playerA.playerName,
        similarityCount
      });
    }
  }

  Object.values(perPlayerSimilarity).forEach((rankings) => {
    rankings.sort((a, b) => b.similarityCount - a.similarityCount);
  });

  const pairwiseSorted = [...pairwise].sort((a, b) => b.similarityCount - a.similarityCount);
  const soulmate = pairwiseSorted.length ? pairwiseSorted[0] : null;

  const popularityCounter = new Map<string, number>();
  const chaosCounter = new Map<string, number>();

  session.players.forEach((_p, peerId) => {
    popularityCounter.set(peerId, 0);
    chaosCounter.set(peerId, 0);
  });

  const questionBreakdown: SimilaritySessionResult["questionBreakdown"] = session.questions.map((question) => {
    const answersForQuestion = session.answerHistory.get(question.questionId) || new Map<string, number | null>();
    const optionCounts = new Map<number, number>();

    answersForQuestion.forEach((optionId) => {
      if (optionId !== null && optionId !== undefined) {
        optionCounts.set(optionId, (optionCounts.get(optionId) || 0) + 1);
      }
    });

    const maxCount = Array.from(optionCounts.values()).reduce((acc, val) => Math.max(acc, val), 0);
    const majorityOptionIds = new Set<number>();
    if (maxCount > 0) {
      optionCounts.forEach((count, optionId) => {
        if (count === maxCount) {
          majorityOptionIds.add(optionId);
        }
      });
    }

    const options = question.options.map((option) => {
      const playersForOption = players.filter((player) => answersForQuestion.get(player.peerId) === option.optionId);

      if (majorityOptionIds.has(option.optionId)) {
        playersForOption.forEach((p) => {
          popularityCounter.set(p.peerId, (popularityCounter.get(p.peerId) || 0) + 1);
        });
      }

      if (playersForOption.length === 1) {
        const uniquePlayer = playersForOption[0];
        chaosCounter.set(uniquePlayer.peerId, (chaosCounter.get(uniquePlayer.peerId) || 0) + 1);
      }

      return {
        optionId: option.optionId,
        optionText: option.optionText,
        imageUrl: option.imageUrl,
        audioUrl: option.audioUrl,
        players: playersForOption.map((p) => ({ peerId: p.peerId, playerName: p.playerName }))
      };
    });

    return {
      questionId: question.questionId,
      questionText: question.questionText,
      options
    };
  });

  const loneWolf = players.length <= 1
    ? null
    : players
        .map((player) => {
          const entries = perPlayerSimilarity[player.peerId] || [];
          const averageSimilarity = entries.length
            ? entries.reduce((sum, entry) => sum + entry.similarityCount, 0) / entries.length
            : 0;
          return { peerId: player.peerId, playerName: player.playerName, averageSimilarity };
        })
        .sort((a, b) => a.averageSimilarity - b.averageSimilarity)[0];

  const mostPopularPicker = players
    .map((player) => ({ peerId: player.peerId, playerName: player.playerName, count: popularityCounter.get(player.peerId) || 0 }))
    .sort((a, b) => b.count - a.count)[0] || null;

  const chaosPicker = players
    .map((player) => ({ peerId: player.peerId, playerName: player.playerName, count: chaosCounter.get(player.peerId) || 0 }))
    .sort((a, b) => b.count - a.count)[0] || null;

  return {
    pairwise: pairwiseSorted,
    publicStats: {
      loneWolf,
      soulmate,
      mostPopularPicker,
      chaosPicker
    },
    questionBreakdown,
    perPlayerSimilarity
  };
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
    isAutoPlay: room.meta?.isAutoPlay ?? true,
    mode: room.meta?.mode || "TRIVIA",
    similarityQuestionCount: room.meta?.similarityQuestionCount || 10
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
    const leaderboard = getSessionLeaderboard(session);
    const payload: any = {
      event: "quizFinished",
      mode: session.mode,
      leaderboard,
      topThree: leaderboard.slice(0, 3)
    };

    if (session.mode === "SIMILARITY") {
      const fullResult = computeSimilarityInsights(session);
      session.players.forEach((player, peerId) => {
        const privateResult: SimilaritySessionResult = {
          ...fullResult,
          perPlayerSimilarity: {
            [peerId]: fullResult.perPlayerSimilarity[peerId] || []
          }
        };
        safeSend(player.ws, {
          ...payload,
          similarityResult: privateResult
        });
      });
    } else {
      broadcastPlayers(session.players, payload);
    }

    if (process.env.NODE_ENV !== "development" && session.mode === "TRIVIA" && session.quizId) {
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
  session.awaitingManualAdvance = false;
  session.interQuestionTimeout = null;

  session.questionTimeout = setTimeout(() => {
    finalizeCurrentQuestion(session.roomId, session.isRoomPublic);
  }, session.questionDurationMs);

  broadcastPlayers(session.players, {
    event: "quizQuestion",
    mode: session.mode,
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
    leaderboard: getSessionLeaderboard(session)
  });
}

function finalizeCurrentQuestion(roomId: string, isRoomPublic: boolean): void {
  const playingRooms = getPlayingRoomsMap(isRoomPublic) as Map<string, PlayingSession>;
  const session = playingRooms.get(roomId);
  if (!session) {
    return;
  }

  if (session.questionTimeout) {
    clearTimeout(session.questionTimeout);
    session.questionTimeout = null;
  }
  session.skipTimerVotes.clear();

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const roundResults: any[] = [];

  const answersForQuestion = new Map<string, number | null>();

  if (session.mode === "TRIVIA") {
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

      answersForQuestion.set(peerId, selectedOptionId);
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
  } else {
    session.players.forEach((player, peerId) => {
      const answer = session.currentAnswers.get(peerId);
      const selectedOptionId = answer?.optionId ?? null;
      answersForQuestion.set(peerId, selectedOptionId);
      roundResults.push({
        peerId,
        playerName: player.playerName,
        selectedOptionId,
        isCorrect: null,
        pointsAwarded: 0,
        speedBonus: 0,
        totalScore: 0
      });
    });
  }

  session.answerHistory.set(currentQuestion.questionId, answersForQuestion);

  broadcastPlayers(session.players, {
    event: "questionResult",
    mode: session.mode,
    questionIndex: session.currentQuestionIndex,
    correctOptionId: session.mode === "TRIVIA" ? currentQuestion.correctOptionId : null,
    results: roundResults,
    leaderboard: getSessionLeaderboard(session),
    nextQuestionInMs: session.isAutoPlay ? session.interQuestionDelayMs : 0,
    isAutoPlay: session.isAutoPlay
  });

  if (session.isAutoPlay) {
    session.interQuestionTimeout = setTimeout(() => {
      beginNextQuestion(session);
    }, session.interQuestionDelayMs);
  } else {
    session.awaitingManualAdvance = true;
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
    const mode = waitingRoom.meta?.mode || "TRIVIA";
    const quizId = waitingRoom.meta?.quizId ?? null;
    let questions: QuizQuestion[] = [];

    if (mode === "SIMILARITY") {
      const count = waitingRoom.meta?.similarityQuestionCount || 10;
      console.log(`startQuiz: Fetching ${count} random SIMILARITY questions`);
      questions = await getRandomSimilarityQuestionsData(count) as QuizQuestion[];
    } else {
      if (quizId === null || quizId === undefined) {
        throw new Error("Quiz ID not found in room meta.");
      }
      console.log(`startQuiz: Fetching questions for quiz ${quizId}`);
      questions = await getQuizQuestionsForPlay(quizId);
    }

    if (!questions.length) {
      console.warn(`startQuiz: Session has no playable questions for mode ${mode}.`);
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
      mode,
      isRoomPublic,
      isAutoPlay: waitingRoom.meta.isAutoPlay,
      players,
      questions,
      currentQuestionIndex: -1,
      currentAnswers: new Map(),
      answerHistory: new Map(),
      questionDurationMs: QUESTION_DURATION_MS,
      interQuestionDelayMs: INTER_QUESTION_DELAY_MS,
      questionStartedAt: null,
      questionStartTime: null,
      questionTimeout: null,
      interQuestionTimeout: null,
      sessionTotalCorrect: 0,
      sessionTotalPossible: 0,
      skipTimerVotes: new Set(),
      awaitingManualAdvance: false,
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
      mode,
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
    if (!session.questionTimeout) {
      safeSend(ws, { event: "submitAnswerFailed", message: "Question is no longer active." });
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
        mode: session.mode,
        leaderboard: getSessionLeaderboard(session)
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

    // Only allow host/manual progression after current round has finalized.
    if (!session.isAutoPlay && session.awaitingManualAdvance) {
      session.awaitingManualAdvance = false;
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
    if (!room.meta.quizId && data?.quizId) {
      room.meta.quizId = Number(data?.quizId);
    }

    if (data?.mode === "SIMILARITY" || data?.mode === "TRIVIA") {
      room.meta.mode = data.mode;
    }

    if (data?.similarityQuestionCount) {
      room.meta.similarityQuestionCount = Math.max(1, Math.min(20, Number(data?.similarityQuestionCount)));
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
      mode: room.meta?.mode || "TRIVIA",
      similarityQuestionCount: room.meta?.similarityQuestionCount || 10,
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

export function getValidGeneratedRoomId(
  isPublic: boolean = true,
  quizId: any = null,
  mode: GameMode = "TRIVIA",
  similarityQuestionCount = 10
): string {
  // Try 1 lackh times to find a room id that is not in use.
  let tries = 0;
  const lackh = 100000;
  while (tries < lackh) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      const roomState = createWaitingRoomState(isPublic, mode, similarityQuestionCount);
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

export function getValidPublicRoomId(
  quizId: any = null,
  mode: GameMode = "TRIVIA",
  similarityQuestionCount = 10
): string {
  const qId = quizId ? Number(quizId) : null;
  for (const [key, value] of publicWaitingRooms) {
    const modeMatches = value.meta.mode === mode;
    const quizMatches = mode === "SIMILARITY" ? true : (value.meta.quizId === qId || !value.meta.quizId);
    if (value.size < 10 && modeMatches && quizMatches) {
      if (!value.meta.quizId) value.meta.quizId = qId;
      return key;
    }
  }
  return getValidGeneratedRoomId(true, qId, mode, similarityQuestionCount);
}
