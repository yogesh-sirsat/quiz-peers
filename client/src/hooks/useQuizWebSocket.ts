import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Peer, { DataConnection } from 'peerjs';
import { addChatMessage, addUpdateRoomPlayer, removeRoomPlayer } from '../store/features/roomSlice';
import { LeaderboardEntry, QuizQuestion, WebSocketEvent } from '../types';

export type QuizStatus = "waiting" | "playing" | "finished";

export interface CurrentQuestion extends QuizQuestion {}

export interface ConnectionData {
    type: string;
    sender?: string;
    text?: string;
    timeStamp?: number;
    peerId?: string;
    muteStatus?: boolean;
    isSpeaking?: boolean;
}

export function useQuizWebSocket(
  roomId: string | undefined, 
  quizId: number | undefined, 
  isRoomPublic: boolean,
  webSocketUrl: string
) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | undefined>();
  const [hostPeerId, setHostPeerId] = useState<string | null>(null);
  const [readyPeerIds, setReadyPeerIds] = useState<string[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("waiting");
  
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionEndsAt, setQuestionEndsAt] = useState<number>(0);
  const [questionDurationMs, setQuestionDurationMs] = useState<number>(15000);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [topThree, setTopThree] = useState<any[]>([]);
  const [skipCount, setSkipCount] = useState<number>(0);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const sendJson = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const handleConnectionData = useCallback((data: ConnectionData) => {
    switch (data.type) {
      case "chatMessage":
        dispatch(addChatMessage({
          id: uuidv4(),
          sender: data?.sender || "Unknown",
          text: data?.text || "",
          timestamp: data?.timeStamp || Date.now()
        }));
        break;
      case "muteStatus":
        dispatch(addUpdateRoomPlayer({
          key: data?.peerId || "", value: { isMute: data?.muteStatus }
        }));
        break;
      case "speakingStatus":
        dispatch(addUpdateRoomPlayer({
          key: data?.peerId || "",
          value: { isSpeaking: data?.isSpeaking }
        }));
        break;
      default:
        break;
    }
  }, [dispatch]);

  const handlePlayerDataConnection = useCallback((player: any, localPlayerName: string) => {
    if (!peerRef.current) return;
    
    let dataConnection = (peerRef.current.connections as any)[player?.peerId]?.find((conn: any) => conn.type === "data");
    if (!dataConnection) {
      dataConnection = peerRef.current.connect(player?.peerId, {
        reliable: true,
        metadata: { playerName: localPlayerName }
      });
    }

    dataConnection.on("open", () => {
      dispatch(addUpdateRoomPlayer({
        key: player?.peerId, value: {
          dataConnection, playerName: player?.playerName, isMute: false
        }
      }));
      dataConnection.on("data", (data: any) => {
        handleConnectionData(data as ConnectionData);
      });
    });
  }, [dispatch, handleConnectionData]);

  const handleJoinRoomSuccess = useCallback((roomData: any, peerId: string, localPlayerName: string) => {
    try {
      roomData?.roomPlayers?.forEach((player: any) => {
        if (player?.peerId === peerId) {
          return;
        }
        handlePlayerDataConnection(player, localPlayerName);
      });
    } catch (e) {
      console.error(e);
    }
  }, [handlePlayerDataConnection]);

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current = new WebSocket(webSocketUrl);
    }
    let peerId: string;
    if (!peerRef.current) {
      peerId = uuidv4();
      peerRef.current = new Peer(peerId, {
        secure: false, debug: 1, config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:freeturn.net:3478",
              username: "free", credential: "free"
            }, {
              urls: "turns:freeturn.net:5349",
              username: "free", credential: "free"
            }]
        }
      });
    } else {
      peerId = peerRef.current.id;
    }

    peerRef.current.on("open", (id) => {
      setLocalPeerId(id);
    });

    peerRef.current.on("connection", (conn: DataConnection) => {
      setTimeout(() => {
        dispatch(addUpdateRoomPlayer({
          key: conn.peer,
          value: { dataConnection: conn, playerName: (conn.metadata as any)?.playerName, isMute: false }
        }));
        dispatch(addChatMessage({
          id: uuidv4(),
          sender: "System",
          text: `${(conn.metadata as any)?.playerName} joined the room!`,
          timestamp: Date.now()
        }));
        conn.on("data", (data: any) => {
          handleConnectionData(data as ConnectionData);
        });
      }, 1000);
    });

    peerRef.current.on("disconnected", () => {
      peerRef.current?.reconnect();
    });

    wsRef.current.onopen = () => {
      setIsWsConnected(true);
      try {
        wsRef.current?.send(JSON.stringify({
          roomId, quizId, peerId, event: "joinRoom", isRoomPublic
        }));
      } catch (e) {
        console.log(e);
      }
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data?.event) {
        case "roomError":
          setRoomError(data?.message || "Room error");
          break;
        case "joinRoomSuccess":
          setPlayerName(data?.playerName || null);
          setHostPeerId(data?.hostPeerId || null);
          setReadyPeerIds(data?.roomPlayers?.filter((player: any) => player.readyToStart).map((player: any) => player.peerId) || []);
          setTotalPlayers(data?.roomPlayers?.length || 0);
          setTimeout(() => {
            handleJoinRoomSuccess(data, peerId, data?.playerName || "");
          }, 1000);
          break;
        case "joinRoomFailed":
          alert(data?.message);
          navigate("/quiz/" + quizId);
          break;
        case "playerNameChanged":
          if (data?.success && data?.newPlayerName) {
            setPlayerName(data.newPlayerName);
          }
          break;
        case "playerLeftWaitingRoom":
          dispatch(removeRoomPlayer(data?.peerId || ""));
          dispatch(addChatMessage({
            id: uuidv4(),
            sender: "System Bot",
            text: `${data?.playerName} left the room.`,
            timestamp: Date.now()
          }));
          break;
        case "waitingRoomState":
          setHostPeerId(data?.hostPeerId || null);
          setReadyPeerIds(data?.readyPeerIds || []);
          setTotalPlayers(data?.totalPlayers || 0);
          if (data?.roomPlayers) {
            data.roomPlayers.forEach((player: any) => {
              dispatch(addUpdateRoomPlayer({
                key: player.peerId,
                value: { playerName: player.playerName }
              }));
            });
          }
          break;
        case "quizStarted":
          setQuizStatus("playing");
          setTotalQuestions(data?.totalQuestions || 0);
          setRoundResults([]);
          break;
        case "quizStartFailed":
          alert(data?.message || "Could not start quiz.");
          break;
        case "quizQuestion":
          setQuizStatus("playing");
          setCurrentQuestion(data?.question || null);
          setQuestionIndex((data?.questionIndex || 0) + 1);
          setTotalQuestions(data?.totalQuestions || 0);
          setQuestionDurationMs(data?.questionDurationMs || 15000);
          setQuestionEndsAt(data?.questionEndsAt || 0);
          setLeaderboard(data?.leaderboard || []);
          setSkipCount(0);
          break;
        case "skipTimerUpdate":
          setSkipCount(data?.skipCount || 0);
          break;
        case "answerAccepted":
          // Can handle if needed
          break;
        case "questionResult":
          setQuestionEndsAt(0);
          setRoundResults(data?.results || []);
          setLeaderboard(data?.leaderboard || []);
          break;
        case "playerLeftPlayingRoom":
          setLeaderboard(data?.leaderboard || []);
          break;
        case "quizFinished":
          setQuizStatus("finished");
          setLeaderboard(data?.leaderboard || []);
          setTopThree(data?.topThree || []);
          setCurrentQuestion(null);
          setRoundResults([]);
          break;
        default:
          break;
      }
    };

    wsRef.current.onerror = () => setIsWsConnected(false);
    wsRef.current.onclose = () => setIsWsConnected(false);

    return () => {
      if (wsRef?.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.onopen = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (peerRef?.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [dispatch, handleConnectionData, handleJoinRoomSuccess, isRoomPublic, navigate, quizId, roomId, webSocketUrl]);

  return {
    playerName,
    localPeerId,
    hostPeerId,
    readyPeerIds,
    totalPlayers,
    quizStatus,
    currentQuestion,
    questionIndex,
    totalQuestions,
    questionEndsAt,
    questionDurationMs,
    leaderboard,
    roundResults,
    topThree,
    skipCount,
    isWsConnected,
    roomError,
    sendJson,
    setQuizStatus,
    setRoundResults,
    setCurrentQuestion,
    setLeaderboard,
    setTopThree
  };
}
