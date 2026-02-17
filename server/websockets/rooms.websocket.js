import { generateRandomRoomId } from "../utils/rooms.utils.js";
import { getGeneratePlayerName } from "./players.websocket.js";
import HttpError from "../errors/app.error.js";
import { getQuizQuestionsForPlay, updateQuizStats } from "../models/quiz.models.js";

export const publicWaitingRooms = new Map();
export const publicPlayingRooms = new Map();
export const privateWaitingRooms = new Map();
export const privatePlayingRooms = new Map();

const QUESTION_DURATION_MS = 15000;
const INTER_QUESTION_DELAY_MS = 3500;

function createWaitingRoomState(isPublic) {
  const room = new Map();
  room.meta = {
    isPublic,
    hostPeerId: null,
    quizId: null,
    isStarting: false
  };
  return room;
}

function getWaitingRoom(roomId, isRoomPublic) {
  return isRoomPublic ? publicWaitingRooms.get(roomId) : privateWaitingRooms.get(roomId);
}

function getPlayingRoomsMap(isRoomPublic) {
  return isRoomPublic ? publicPlayingRooms : privatePlayingRooms;
}

function getBasePointsForDifficulty(difficulty) {
  if (difficulty === "Easy") {
    return 100;
  }
  if (difficulty === "Hard") {
    return 220;
  }
  return 150;
}

function getLeaderboard(session) {
  return Array.from(session.players, ([peerId, player]) => ({
    peerId,
    playerName: player.playerName,
    score: player.score
  })).sort((a, b) => b.score - a.score);
}

function safeSend(ws, payload) {
  try {
    ws?.send(JSON.stringify(payload));
  } catch (error) {
    console.error(error);
  }
}

function broadcastPlayers(playersMap, payload) {
  playersMap.forEach((player) => {
    safeSend(player?.ws, payload);
  });
}

function getWaitingRoomStatePayload(room, roomId) {
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
    hostPeerId: room.meta?.hostPeerId || null
  };
}

function emitWaitingRoomState(roomId, isRoomPublic) {
  const room = getWaitingRoom(roomId, isRoomPublic);
  if (!room) {
    return;
  }
  const payload = getWaitingRoomStatePayload(room, roomId);
  broadcastPlayers(room, payload);
}

function emitPlayerLeftWaitingRoom(roomPlayers, peerId, playerName) {
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

function beginNextQuestion(session) {
  const playingRooms = getPlayingRoomsMap(session.isRoomPublic);
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
    questionEndsAt: session.questionStartedAt + session.questionDurationMs,
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

function finalizeCurrentQuestion(roomId, isRoomPublic) {
  const playingRooms = getPlayingRoomsMap(isRoomPublic);
  const session = playingRooms.get(roomId);
  if (!session) {
    return;
  }

  clearTimeout(session.questionTimeout);
  session.skipTimerVotes.clear();

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const roundResults = [];

  session.sessionTotalPossible += session.players.size;

  session.players.forEach((player, peerId) => {
    const answer = session.currentAnswers.get(peerId);
    const selectedOptionId = answer?.optionId ?? null;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect) {
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
    nextQuestionInMs: session.interQuestionDelayMs
  });

  session.interQuestionTimeout = setTimeout(() => {
    beginNextQuestion(session);
  }, session.interQuestionDelayMs);
}

async function startQuiz(roomId, isRoomPublic) {
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

    const players = new Map();
    waitingRoom.forEach((player, peerId) => {
      players.set(peerId, {
        playerName: player.playerName,
        ws: player.ws,
        score: 0
      });
    });

    const session = {
      roomId,
      quizId,
      isRoomPublic,
      players,
      questions,
      currentQuestionIndex: -1,
      currentAnswers: new Map(),
      questionDurationMs: QUESTION_DURATION_MS,
      interQuestionDelayMs: INTER_QUESTION_DELAY_MS,
      questionStartedAt: null,
      questionTimeout: null,
      interQuestionTimeout: null,
      sessionTotalCorrect: 0,
      sessionTotalPossible: 0,
      skipTimerVotes: new Set()
    };

    getPlayingRoomsMap(isRoomPublic).set(roomId, session);
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

export function handleReadyToStart(ws, data) {
  try {
    const isRoomPublic = data?.isRoomPublic ?? true;
    const room = getWaitingRoom(data?.roomId, isRoomPublic);
    if (!room || !room.has(ws.peerId)) {
      safeSend(ws, { event: "readyToStartFailed", message: "Room not found." });
      return;
    }

    const player = room.get(ws.peerId);
    player.readyToStart = data?.readyToStart ?? true;
    room.set(ws.peerId, player);

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

export function handleStartPrivateQuiz(ws, data) {
  try {
    const room = getWaitingRoom(data?.roomId, false);
    if (!room) {
      safeSend(ws, { event: "startQuizFailed", message: "Room not found." });
      return;
    }
    if (room.meta?.hostPeerId !== ws.peerId) {
      safeSend(ws, { event: "startQuizFailed", message: "Only the quiz creator can start this private room." });
      return;
    }
    startQuiz(data?.roomId, false);
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "startQuizFailed", message: "Unable to start quiz." });
  }
}

export function handleSubmitAnswer(ws, data) {
  try {
    const playingRooms = getPlayingRoomsMap(data?.isRoomPublic);
    const session = playingRooms.get(data?.roomId);
    if (!session || !session.players.has(ws.peerId)) {
      safeSend(ws, { event: "submitAnswerFailed", message: "No active quiz session found." });
      return;
    }

    if (!session.questions[session.currentQuestionIndex]) {
      safeSend(ws, { event: "submitAnswerFailed", message: "No active question." });
      return;
    }

    session.currentAnswers.set(ws.peerId, {
      optionId: data?.optionId,
      submittedAt: Date.now()
    });
    safeSend(ws, { event: "answerAccepted", alreadyAnswered: false });
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "submitAnswerFailed", message: "Unable to submit answer." });
  }
}

export function handleSkipTimer(ws, data) {
  try {
    const playingRooms = getPlayingRoomsMap(data?.isRoomPublic);
    const session = playingRooms.get(data?.roomId);
    
    if (!session || !session.players.has(ws.peerId)) {
      return;
    }
    
    // Can only skip if question is active and user has answered
    if (!session.currentAnswers.has(ws.peerId)) {
      return;
    }

    session.skipTimerVotes.add(ws.peerId);
    
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

export function handleLeaveWaitingRoom(ws) {
  try {
    if (!ws?.roomId || !ws?.peerId) {
      return;
    }

    const waitingRoom = getWaitingRoom(ws.roomId, ws.isRoomPublic);
    if (waitingRoom?.has(ws.peerId)) {
      waitingRoom.delete(ws.peerId);
      emitPlayerLeftWaitingRoom(waitingRoom, ws.peerId, ws.playerName);

      if (!ws.isRoomPublic && waitingRoom.meta?.hostPeerId === ws.peerId) {
        const [nextHostPeerId] = waitingRoom.keys();
        waitingRoom.meta.hostPeerId = nextHostPeerId || null;
      }

      emitWaitingRoomState(ws.roomId, ws.isRoomPublic);
      return;
    }

    const playingRooms = getPlayingRoomsMap(ws.isRoomPublic);
    const session = playingRooms.get(ws.roomId);
    if (session?.players?.has(ws.peerId)) {
      session.players.delete(ws.peerId);
      session.currentAnswers.delete(ws.peerId);

      broadcastPlayers(session.players, {
        event: "playerLeftPlayingRoom",
        peerId: ws.peerId,
        playerName: ws.playerName,
        leaderboard: getLeaderboard(session)
      });

      if (session.players.size === 0) {
        clearTimeout(session.questionTimeout);
        clearTimeout(session.interQuestionTimeout);
        playingRooms.delete(ws.roomId);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export function handleChangePlayerName(ws, data) {
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

    if (!room.has(ws.peerId)) {
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

    const player = room.get(ws.peerId);
    player.playerName = newName;
    room.set(ws.peerId, player);
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

export function handleJoinRoom(ws, data) {
  try {
    ws.peerId = data?.peerId;
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
    room.set(data?.peerId, { playerName, ws, readyToStart: false });

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
  } catch (error) {
    console.error(error);
    safeSend(ws, { event: "joinRoomFailed", message: error.message });
  }
}

export function getRoomDetails(roomId) {
  if (publicWaitingRooms.has(roomId)) {
    return publicWaitingRooms.get(roomId);
  }
  if (publicPlayingRooms.has(roomId)) {
    return publicPlayingRooms.get(roomId);
  }
  if (privateWaitingRooms.has(roomId)) {
    return privateWaitingRooms.get(roomId);
  }
  if (privatePlayingRooms.has(roomId)) {
    return privatePlayingRooms.get(roomId);
  }
  throw new HttpError("Room not found", 404);
}

export function isRoomIdInUse(roomId) {
  return (publicWaitingRooms.has(roomId) || privateWaitingRooms.has(roomId) || publicPlayingRooms.has(roomId) || privatePlayingRooms.has(roomId));
}

export function getValidGeneratedRoomId(isPublic = true, quizId = null) {
  // Try 1 Million times to find a room id that is not in use.
  let tries = 0;
  const million = 1000000;
  while (tries < million) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      const roomState = createWaitingRoomState(isPublic);
      roomState.meta.quizId = quizId;
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

export function getValidPublicRoomId(quizId = null) {
  for (const [key, value] of publicWaitingRooms) {
    if (value.size < 10 && (value.meta.quizId === quizId || !value.meta.quizId)) {
      if (!value.meta.quizId) value.meta.quizId = quizId;
      return key;
    }
  }
  return getValidGeneratedRoomId(true, quizId);
}
