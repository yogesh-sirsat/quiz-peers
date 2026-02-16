import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Crown, Mic, MicOff, Trophy, Pencil, FastForward } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { MEDIA_CONSTRAINTS } from "../config/mediaConfig.js";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager.jsx";
import { useDispatch, useSelector } from "react-redux";
import { addChatMessage, addUpdateRoomPlayer, removeRoomPlayer } from "../store/features/roomSlice.js";
import TextChatInterface from "../components/quiz-meet-room/TextChatInterface.jsx";
import QuizPlayRoom from "./QuizPlayRoom.jsx";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal.jsx";
import useAudioActivity from "../hooks/useAudioActivity.js";

function LeaderboardModal({ isOpen, onOpenChange, leaderboard, toggleMute }) {
  const roomPlayers = useSelector((state) => state.room.roomPlayers);

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

export default function QuizMeetRoom() {
  const dispatch = useDispatch();
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const navigate = useNavigate();
  const { quizId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState(searchParams.get("public") === "true");
  const [roomError, setRoomError] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [localPeerId, setLocalPeerId] = useState();
  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState(true);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const [hostPeerId, setHostPeerId] = useState(null);
  const [readyPeerIds, setReadyPeerIds] = useState([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isReadyToStart, setIsReadyToStart] = useState(false);

  const [quizStatus, setQuizStatus] = useState("waiting");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionEndsAt, setQuestionEndsAt] = useState(0);
  const [questionDurationMs, setQuestionDurationMs] = useState(15000);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [correctOptionId, setCorrectOptionId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roundResults, setRoundResults] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [skipCount, setSkipCount] = useState(0);
  const [localStream, setLocalStream] = useState(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(new MediaStream());
  const wsRef = useRef(null);
  
  const isSpeaking = useAudioActivity(localStream);
  const roomPlayers = useSelector((state) => state.room.roomPlayers);

  const isHost = useMemo(() => hostPeerId && localPeerId && hostPeerId === localPeerId, [hostPeerId, localPeerId]);
  const readyCount = readyPeerIds.length;

  const toggleMute = useCallback((peerId, currentMuteStatus) => {
    dispatch(addUpdateRoomPlayer({
      key: peerId,
      value: { isMute: !currentMuteStatus }
    }));
  }, [dispatch]);

  const handleSaveName = useCallback((newName) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      event: "changePlayerName",
      roomId,
      isRoomPublic,
      newName
    }));
  }, [isRoomPublic, roomId]);

  useEffect(() => {
    const isPublicParams = searchParams.get("public");
    if (isPublicParams) {
      setIsRoomPublic(isPublicParams === "true");
    } else {
      navigate("/pagenotfound");
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    let currentLocalStream;
    const constraints = {
      ...MEDIA_CONSTRAINTS,
      audio: { ...MEDIA_CONSTRAINTS.audio }
    };
    if (selectedAudioDevice) {
      constraints.audio.deviceId = selectedAudioDevice;
    }
    (async () => {
      try {
        currentLocalStream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current.srcObject = currentLocalStream;
        localStreamRef.current.muted = true;
        localStreamRef.current.onloadedmetadata = () => {
          localStreamRef.current.play();
        };
        setLocalStream(currentLocalStream);
      } catch (e) {
        alert(e.message);
        console.error(e);
      }
    })();
    return () => {
      if (currentLocalStream) {
        currentLocalStream?.getTracks().forEach((track) => track.stop());
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

  const handleConnectionData = useCallback((data) => {
    switch (data.type) {
      case "chatMessage":
        dispatch(addChatMessage({
          sender: data?.sender,
          isPlayer: true,
          text: data?.text,
          timeStamp: data?.timeStamp
        }));
        break;
      case "muteStatus":
        dispatch(addUpdateRoomPlayer({
          key: data?.peerId, value: { isMute: data?.muteStatus }
        }));
        break;
      case "speakingStatus":
        dispatch(addUpdateRoomPlayer({
          key: data?.peerId,
          value: { isSpeaking: data?.isSpeaking }
        }));
        break;
      default:
        break;
    }
  }, [dispatch]);

  const handlePlayerDataConnection = useCallback((player, localPlayerName) => {
    let dataConnection = peerRef.current.connections[player?.peerId]?.find((conn) => conn.type === "data");
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
      dataConnection.on("data", (data) => {
        handleConnectionData(data);
      });
    });
  }, [dispatch, handleConnectionData]);

  const handleJoinRoomSuccess = useCallback((roomData, peerId, localPlayerName) => {
    try {
      roomData?.roomPlayers?.forEach((player) => {
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
    if (!wsRef.current) {
      return;
    }
    if (isRoomPublic) {
      const nextReady = !isReadyToStart;
      setIsReadyToStart(nextReady);
      wsRef.current.send(JSON.stringify({
        event: "readyToStart",
        roomId,
        isRoomPublic: true,
        readyToStart: nextReady
      }));
      return;
    }

    wsRef.current.send(JSON.stringify({
      event: "startPrivateQuiz",
      roomId,
      isRoomPublic: false
    }));
  }, [isRoomPublic, isReadyToStart, roomId]);

  const handleSubmitAnswer = useCallback((optionId) => {
    if (!wsRef.current || !currentQuestion || quizStatus !== "playing") {
      return;
    }
    setHasAnsweredCurrent(true);
    setSelectedOptionId(optionId);
    wsRef.current.send(JSON.stringify({
      event: "submitAnswer",
      roomId,
      isRoomPublic,
      optionId
    }));
  }, [currentQuestion, isRoomPublic, quizStatus, roomId]);

  const handleSkipTimer = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      event: "skipTimer",
      roomId,
      isRoomPublic
    }));
  }, [isRoomPublic, roomId]);

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocket(webSocketUrl);
    }
    let peerId;
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
      peerId = peerRef.current?.id;
    }

    peerRef.current.on("open", (id) => {
      setLocalPeerId(id);
    });

    peerRef.current.on("connection", (conn) => {
      setTimeout(() => {
        dispatch(addUpdateRoomPlayer({
          key: conn.peer,
          value: { dataConnection: conn, playerName: conn?.metadata?.playerName, isMute: false }
        }));
        dispatch(addChatMessage({
          sender: "System",
          isPlayer: false,
          text: `${conn?.metadata?.playerName} joined the room!`,
          timeStamp: Date.now()
        }));
        conn.on("data", (data) => {
          handleConnectionData(data);
        });
      }, 1000);
    });

    peerRef.current.on("disconnected", () => {
      peerRef.current.reconnect();
    });

    wsRef.current.onopen = () => {
      try {
        wsRef.current.send(JSON.stringify({
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
          setRoomError(data?.message);
          break;
        case "joinRoomSuccess":
          setPlayerName(data?.playerName);
          setHostPeerId(data?.hostPeerId || null);
          setReadyPeerIds(data?.roomPlayers?.filter((player) => player.readyToStart).map((player) => player.peerId) || []);
          setTotalPlayers(data?.roomPlayers?.length || 0);
          setTimeout(() => {
            handleJoinRoomSuccess(data, peerId, data?.playerName);
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
          dispatch(removeRoomPlayer(data?.peerId));
          dispatch(addChatMessage({
            sender: "System Bot",
            isPlayer: false,
            text: `${data?.playerName} left the room.`,
            timeStamp: Date.now()
          }));
          break;
        case "waitingRoomState":
          setHostPeerId(data?.hostPeerId || null);
          setReadyPeerIds(data?.readyPeerIds || []);
          setTotalPlayers(data?.totalPlayers || 0);
          if (data?.roomPlayers) {
            data.roomPlayers.forEach((player) => {
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
          setCurrentQuestion(data?.question);
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
          setCorrectOptionId(data?.correctOptionId);
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
    };

    return () => {
      if (wsRef?.current) {
        wsRef.current.close();
      }
      if (peerRef?.current) {
        peerRef.current.destroy();
      }
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
      // Update local state in Redux (only if changed to avoid potential render cycles if logic was different)
      // Actually, dispatching same value is usually optimized by Redux or React, but safe to do.
      dispatch(addUpdateRoomPlayer({
        key: localPeerId,
        value: { isSpeaking: !isLocalPlayerMute && isSpeaking }
      }));

      // Broadcast to peers
      Object.values(roomPlayersRef.current).forEach((player) => {
        if (player?.dataConnection?.open) {
          player.dataConnection.send({
            type: "speakingStatus",
            isSpeaking: !isLocalPlayerMute && isSpeaking,
            peerId: localPeerId
          });
        }
      });
    }
  }, [isSpeaking, localPeerId, isLocalPlayerMute, dispatch]); // Intentionally omitting roomPlayers to avoid loop, using ref.


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

  const optionClassName = (optionId) => {
    if (correctOptionId !== null) {
      if (optionId === correctOptionId) {
        return "border-green-500 bg-green-500/20";
      }
      if (optionId === selectedOptionId && selectedOptionId !== correctOptionId) {
        return "border-red-500 bg-red-500/20";
      }
    } else if (selectedOptionId === optionId) {
      return "border-amber-400 bg-amber-400/20";
    }
    return "border-background/20 bg-background/10 hover:bg-background/20";
  };

  return (
    <section className="w-screen min-h-screen max-h-screen flex flex-col overflow-y-auto">
      <NavbarComponent />
      <article
        className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col overflow-y-auto">
        {quizStatus === "waiting" && <QuizNameCard quizId={quizId} />}

        <section className="mb-6 flex flex-col gap-3 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl overflow-y-auto">
          <div className="flex flex-row justify-between items-center mb-1 pr-1 gap-2">
            <h1 className="text-xl xs:text-2xl font-semibold">Quiz Room</h1>
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
              <TextChatInterface localPeerId={localPeerId} localPlayerName={playerName} />
            </div>
          </div>

          {quizStatus === "waiting" && (
            <div className="rounded-xl border border-background/20 bg-background/10 p-3">
              {isRoomPublic ? (
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <p className="text-sm">
                    Public room starts when everyone is ready. Ready: {readyCount}/{totalPlayers || 1}
                  </p>
                  <Button color={isReadyToStart ? "warning" : "success"} onClick={handleStartClick}>
                    {isReadyToStart ? "Cancel Ready" : "Start Quiz"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <p className="text-sm flex items-center gap-1">
                    <Crown size={16} className={isHost ? "text-amber-300" : "opacity-70"} />
                    {isHost ? "You created this private room. Start when everyone is ready." : "Waiting for quiz creator to start."}
                  </p>
                  <Button color="secondary" onClick={handleStartClick} isDisabled={!isHost}>
                    Start Quiz
                  </Button>
                </div>
              )}
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
              <li
                key={ind}
                className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl"
              >
                <Button 
                  variant={"flat"} 
                  size={"sm"} 
                  isIconOnly 
                  onClick={() => toggleMute(key, value?.isMute)}
                  className={value?.isSpeaking ? "border-2 border-green-500" : ""}
                >
                  {value?.isMute ? <MicOff size={22} /> : <Mic size={22} />}
                </Button>
                <h2 className={"flex-1 text-center"}>{value?.playerName}</h2>
              </li>
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
              localPeerId={localPeerId}
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
