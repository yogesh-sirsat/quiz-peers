import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Crown, Mic, MicOff, Trophy, Pencil, FastForward, Share2, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Peer, { DataConnection } from "peerjs";
import { MEDIA_CONSTRAINTS } from "../config/mediaConfig";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { addChatMessage, addUpdateRoomPlayer, removeRoomPlayer } from "../store/features/roomSlice";
import TextChatInterface from "../components/quiz-meet-room/TextChatInterface";
import QuizPlayRoom from "./QuizPlayRoom";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal";
import useAudioActivity from "../hooks/useAudioActivity";
import { LeaderboardEntry, QuizQuestion } from "../types";

interface LeaderboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leaderboard: LeaderboardEntry[];
  toggleMute: (peerId: string, currentMuteStatus: boolean) => void;
}

function LeaderboardModal({ isOpen, onOpenChange, leaderboard, toggleMute }: LeaderboardModalProps) {
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);

  return (
    <Modal
      size={"lg"}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      classNames={{
        closeButton: "hover:bg-background/30 active:bg-background/25"
      }}
    >
      <ModalContent className="text-foreground bg-[#AF99B8]">
        <ModalHeader className="text-2xl">Leaderboard</ModalHeader>
        <ModalBody className="pb-6">
          <ul className="flex flex-col gap-2">
            {leaderboard.length === 0 ? (
              <li className="text-sm opacity-80">No scores yet.</li>
            ) : (
              leaderboard.map((player, index) => {
                const roomPlayer = roomPlayers[player.peerId];
                const isMute = roomPlayer?.isMute || false;
                
                return (
                <li
                  key={player.peerId}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bg-background/10 border border-background/20"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-medium">#{index + 1}</p>
                    {roomPlayer && (
                       <Button 
                         variant="light" 
                         size="sm" 
                         isIconOnly 
                         onClick={() => toggleMute(player.peerId, isMute)}
                         className={roomPlayer?.isSpeaking ? "border-2 border-green-500" : ""}
                       >
                         {isMute ? <MicOff size={16} /> : <Mic size={16} />}
                       </Button>
                    )}
                    <p className="font-medium">{player.playerName}</p>
                  </div>
                  <p className="font-semibold">{player.score} pts</p>
                </li>
              )})
            )}
          </ul>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

type QuizStatus = "waiting" | "playing" | "finished";

interface CurrentQuestion extends QuizQuestion {}

interface QuizRoomData {
    event: string;
    roomId?: string;
    quizId?: string;
    peerId?: string;
    isRoomPublic?: boolean;
    playerName?: string;
    hostPeerId?: string | null;
    roomPlayers?: any[];
    message?: string;
    success?: boolean;
    newPlayerName?: string;
    readyPeerIds?: string[];
    totalPlayers?: number;
    totalQuestions?: number;
    question?: CurrentQuestion;
    questionIndex?: number;
    questionDurationMs?: number;
    questionEndsAt?: number;
    leaderboard?: LeaderboardEntry[];
    skipCount?: number;
    alreadyAnswered?: boolean;
    correctOptionId?: string;
    results?: any[];
    topThree?: any[];
}

interface ConnectionData {
    type: string;
    sender?: string;
    text?: string;
    timeStamp?: number;
    peerId?: string;
    muteStatus?: boolean;
    isSpeaking?: boolean;
}

export default function QuizMeetRoom() {
  const dispatch = useDispatch();
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const navigate = useNavigate();
  const { quizId, roomId } = useParams<{ quizId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState<boolean>(searchParams.get("public") === "true");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | undefined>();
  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState<boolean>(true);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);

  const [hostPeerId, setHostPeerId] = useState<string | null>(null);
  const [readyPeerIds, setReadyPeerIds] = useState<string[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isReadyToStart, setIsReadyToStart] = useState<boolean>(false);

  const [quizStatus, setQuizStatus] = useState<QuizStatus>("waiting");
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionEndsAt, setQuestionEndsAt] = useState<number>(0);
  const [questionDurationMs, setQuestionDurationMs] = useState<number>(15000);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [roundResults, setRoundResults] = useState<any[]>([]);
  const [topThree, setTopThree] = useState<any[]>([]);
  const [skipCount, setSkipCount] = useState<number>(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream>(new MediaStream());
  const wsRef = useRef<WebSocket | null>(null);

  const handleShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  }, []);

  const sendJson = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not open. State:", wsRef.current?.readyState);
    }
  }, []);
  
  const isSpeaking = useAudioActivity(localStream);
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);

  const isHost = useMemo(() => hostPeerId && localPeerId && hostPeerId === localPeerId, [hostPeerId, localPeerId]);

  const toggleMute = useCallback((peerId: string, currentMuteStatus: boolean) => {
    dispatch(addUpdateRoomPlayer({
      key: peerId,
      value: { isMute: !currentMuteStatus }
    }));
  }, [dispatch]);

  const handleSaveName = useCallback((newName: string) => {
    sendJson({
      event: "changePlayerName",
      roomId,
      isRoomPublic,
      newName
    });
  }, [isRoomPublic, roomId, sendJson]);

  useEffect(() => {
    const isPublicParams = searchParams.get("public");
    if (isPublicParams) {
      setIsRoomPublic(isPublicParams === "true");
    } else {
      // Allow it to proceed if we already have it from initial state or search params
    }
  }, [searchParams]);

  useEffect(() => {
    let currentLocalStream: MediaStream;
    const constraints: any = {
      ...MEDIA_CONSTRAINTS,
      audio: { ...(MEDIA_CONSTRAINTS.audio as any) }
    };
    if (selectedAudioDevice) {
      constraints.audio.deviceId = selectedAudioDevice;
    }
    (async () => {
      try {
        currentLocalStream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current.srcObject = currentLocalStream;
        // @ts-ignore
        localStreamRef.current.muted = true;
        setLocalStream(currentLocalStream);
      } catch (e: any) {
        alert(e.message);
        console.error(e);
      }
    })();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = new MediaStream();
    };
  }, [selectedAudioDevice]);

  useEffect(() => {
    if (!questionEndsAt || quizStatus !== "playing") {
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, questionEndsAt - Date.now());
      setTimeRemainingMs(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [questionEndsAt, quizStatus]);

  useEffect(() => {
    if (!localPeerId) {
      return;
    }
    setIsReadyToStart(readyPeerIds.includes(localPeerId));
  }, [localPeerId, readyPeerIds]);

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

  const handleStartClick = useCallback(() => {
    if (!isRoomPublic && isHost) {
      sendJson({
        event: "startPrivateQuiz",
        roomId,
        isRoomPublic: false
      });
      return;
    }

    const nextReady = !isReadyToStart;
    setIsReadyToStart(nextReady);
    sendJson({
      event: "readyToStart",
      roomId,
      isRoomPublic,
      readyToStart: nextReady
    });
  }, [isRoomPublic, isHost, isReadyToStart, roomId, sendJson]);

  const handleSubmitAnswer = useCallback((optionId: string) => {
    if (!currentQuestion || quizStatus !== "playing") {
      return;
    }
    setHasAnsweredCurrent(true);
    setSelectedOptionId(optionId);
    sendJson({
      event: "submitAnswer",
      roomId,
      isRoomPublic,
      optionId
    });
  }, [currentQuestion, isRoomPublic, quizStatus, roomId, sendJson]);

  const handleSkipTimer = useCallback(() => {
    sendJson({
      event: "skipTimer",
      roomId,
      isRoomPublic
    });
  }, [isRoomPublic, roomId, sendJson]);

  useEffect(() => {
    const checkStatus = () => {
      if (wsRef.current) {
        setIsWsConnected(wsRef.current.readyState === WebSocket.OPEN);
      }
    };
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

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
      const data: QuizRoomData = JSON.parse(event.data);
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
          setCorrectOptionId(null);
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
          setTimeRemainingMs(Math.max(0, (data?.questionEndsAt || 0) - Date.now()));
          setHasAnsweredCurrent(false);
          setSelectedOptionId(null);
          setCorrectOptionId(null);
          setRoundResults([]);
          setLeaderboard(data?.leaderboard || []);
          setSkipCount(0);
          break;
        case "skipTimerUpdate":
          setSkipCount(data?.skipCount || 0);
          break;
        case "answerAccepted":
          if (data?.alreadyAnswered) {
            setHasAnsweredCurrent(true);
          }
          break;
        case "questionResult":
          setQuestionEndsAt(0);
          setCorrectOptionId(data?.correctOptionId || null);
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
          setCorrectOptionId(null);
          setRoundResults([]);
          break;
        default:
          break;
      }
    };

    wsRef.current.onerror = (error) => {
      console.log(error);
      setIsWsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsWsConnected(false);
    };

    return () => {
      console.log("Cleaning up WebSocket and Peer...");
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
      setIsWsConnected(false);
    };
  }, [dispatch, handleConnectionData, handleJoinRoomSuccess, isRoomPublic, navigate, quizId, roomId, webSocketUrl]);

  useEffect(() => {
    if (roomError) {
      alert(roomError);
    }
  }, [roomError]);

  useEffect(() => {
    if (localPeerId) {
      dispatch(addUpdateRoomPlayer({
        key: localPeerId,
        value: { isMute: isLocalPlayerMute }
      }));
    }
  }, [localPeerId, isLocalPlayerMute, dispatch]);

  const roomPlayersRef = useRef(roomPlayers);
  useEffect(() => {
    roomPlayersRef.current = roomPlayers;
  }, [roomPlayers]);

  useEffect(() => {
    if (localPeerId) {
      dispatch(addUpdateRoomPlayer({
        key: localPeerId,
        value: { isSpeaking: !isLocalPlayerMute && isSpeaking }
      }));

      Object.values(roomPlayersRef.current).forEach((player: any) => {
        if (player?.dataConnection?.open) {
          player.dataConnection.send({
            type: "speakingStatus",
            isSpeaking: !isLocalPlayerMute && isSpeaking,
            peerId: localPeerId
          });
        }
      });
    }
  }, [isSpeaking, localPeerId, isLocalPlayerMute, dispatch]);


  const localPlayerRow = useMemo(() => ({
    peerId: localPeerId,
    playerName: `${playerName || "Player"} (You)`
  }), [localPeerId, playerName]);

  const timerPercent = useMemo(() => {
    if (!questionEndsAt || quizStatus !== "playing") {
      return 0;
    }
    return Math.max(0, Math.min(100, (timeRemainingMs / questionDurationMs) * 100));
  }, [questionDurationMs, questionEndsAt, quizStatus, timeRemainingMs]);

  return (
    <section className="w-screen min-h-screen max-h-screen flex flex-col overflow-y-auto">
      <NavbarComponent />
      <article
        className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col overflow-y-auto">
        {quizStatus === "waiting" && <QuizNameCard quizId={quizId || ""} />}

        <section className="mb-6 flex flex-col gap-3 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl overflow-y-auto">
          <div className="flex flex-row justify-between items-center mb-1 pr-1 gap-2">
            <div className="flex flex-col">
                <h1 className="text-xl xs:text-2xl font-semibold">Quiz Room</h1>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isWsConnected ? 'text-success-300' : 'text-danger animate-pulse'}`}>
                    {isWsConnected ? '● Connected' : '○ Reconnecting...'}
                </p>
            </div>
            <div className="flex items-center gap-2">
              {quizStatus === "playing" && hasAnsweredCurrent && correctOptionId === null && (
                <Button
                  variant="flat"
                  color="warning"
                  size="sm"
                  startContent={<FastForward size={18} />}
                  onClick={handleSkipTimer}
                  className="font-semibold min-w-0 px-3"
                >
                  <span className="hidden xs:inline">Skip Timer</span> ({skipCount}/{totalPlayers})
                </Button>
              )}
              <Button
                variant="flat"
                radius="sm"
                size="sm"
                startContent={<Trophy size={18} />}
                onClick={() => setIsLeaderboardOpen(true)}
                className="min-w-0 px-3"
              >
                <span className="hidden xs:inline">Leaderboard</span>
              </Button>
              {quizStatus === "waiting" && (
                <Button
                    variant="flat"
                    radius="sm"
                    size="sm"
                    color={isLinkCopied ? "success" : "default"}
                    startContent={isLinkCopied ? <Check size={18} /> : <Share2 size={18} />}
                    onClick={handleShareLink}
                    className="min-w-0 px-3 w-[120px]"
                >
                    <span className="hidden xs:inline">{isLinkCopied ? "Copied!" : "Invite Friends"}</span>
                </Button>
              )}
              <TextChatInterface localPeerId={localPeerId || ""} localPlayerName={playerName || "Player"} />
            </div>
          </div>

          {quizStatus === "waiting" && (
            <div className="rounded-xl border border-background/20 bg-background/10 p-3">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {isRoomPublic ? "Public Room" : "Private Room"} | Ready: {readyPeerIds.length}/{totalPlayers}
                  </p>
                  <p className="text-xs opacity-70 flex items-center gap-1">
                    {!isRoomPublic && (
                      <>
                        <Crown size={14} className={isHost ? "text-amber-300" : ""} />
                        {isHost ? "Host controls the start." : "Waiting for host to start."}
                      </>
                    )}
                    {isRoomPublic && "Auto-starts when everyone is ready."}
                  </p>
                </div>
                <div className="flex gap-2 w-full xs:w-auto">
                  <Button 
                    className="flex-1 xs:flex-initial"
                    color={isReadyToStart ? "secondary" : "success"} 
                    onClick={handleStartClick} 
                    isDisabled={!isWsConnected}
                  >
                    {isReadyToStart ? "READY" : "Ready Up"}
                  </Button>
                  {!isRoomPublic && isHost && (
                    <Button 
                      className="flex-1 xs:flex-initial"
                      color="primary" 
                      onClick={handleStartClick} 
                      isDisabled={!isWsConnected}
                    >
                      Start Quiz
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <ul className={"flex flex-col gap-2 pr-1 rounded-2xl overflow-y-auto"}>
            <li className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
              <AudioDeviceManager {...{
                selectedAudioDevice,
                setSelectedAudioDevice,
                isLocalPlayerMute,
                setIsLocalPlayerMute,
                isSpeaking
              }}
              />
              <div className="flex-1 flex items-center justify-center gap-2">
                <h2 className={"text-center"}>{localPlayerRow.playerName}</h2>
                {quizStatus === "waiting" && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="min-w-6 w-6 h-6 bg-white/20 hover:bg-white/40 text-white"
                    onClick={() => setIsNameModalOpen(true)}
                  >
                    <Pencil size={14} />
                  </Button>
                )}
              </div>
            </li>
            {quizStatus === "waiting" && Object.entries(roomPlayers).map(([key, value], ind) => (
               key !== localPeerId && (
              <li
                key={ind}
                className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl"
              >
                <Button 
                  variant={"flat"} 
                  size={"sm"} 
                  isIconOnly 
                  onClick={() => toggleMute(key, value?.isMute || false)}
                  className={value?.isSpeaking ? "border-2 border-green-500" : ""}
                >
                  {value?.isMute ? <MicOff size={22} /> : <Mic size={22} />}
                </Button>
                <h2 className={"flex-1 text-center"}>{value?.playerName}</h2>
              </li>
               )
            ))}
          </ul>

          {(quizStatus === "playing" || quizStatus === "finished") && (
            <QuizPlayRoom
              quizStatus={quizStatus}
              currentQuestion={currentQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              timeRemainingMs={timeRemainingMs}
              questionDurationMs={questionDurationMs}
              timerPercent={timerPercent}
              roundResults={roundResults}
              topThree={topThree}
              localPeerId={localPeerId || ""}
              handleSubmitAnswer={handleSubmitAnswer}
              hasAnsweredCurrent={hasAnsweredCurrent}
              selectedOptionId={selectedOptionId}
              correctOptionId={correctOptionId}
              setIsLeaderboardOpen={setIsLeaderboardOpen}
            />
          )}
        </section>
      </article>

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onOpenChange={(open) => setIsLeaderboardOpen(open)}
        leaderboard={leaderboard}
        toggleMute={toggleMute}
      />
      
      <PlayerNameModal
        isOpen={isNameModalOpen}
        onOpenChange={(open) => setIsNameModalOpen(open)}
        currentName={playerName}
        onSave={handleSaveName}
      />
    </section>
  );
}
