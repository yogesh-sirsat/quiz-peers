import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Crown, Mic, MicOff, Sparkles, Timer, Trophy } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { MEDIA_CONSTRAINTS } from "../config/mediaConfig.js";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager.jsx";
import { useDispatch, useSelector } from "react-redux";
import { addChatMessage, addUpdateRoomPlayer, removeRoomPlayer } from "../store/features/roomSlice.js";
import TextChatInterface from "../components/quiz-meet-room/TextChatInterface.jsx";
import { AnimatePresence, motion } from "framer-motion";

function LeaderboardModal({ isOpen, onOpenChange, leaderboard }) {
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
              leaderboard.map((player, index) => (
                <li
                  key={player.peerId}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bg-background/10 border border-background/20"
                >
                  <p className="font-medium">#{index + 1} {player.playerName}</p>
                  <p className="font-semibold">{player.score} pts</p>
                </li>
              ))
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
  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState(false);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

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

  const peerRef = useRef(null);
  const localStreamRef = useRef(new MediaStream());
  const wsRef = useRef(null);
  const roomPlayers = useSelector((state) => state.room.roomPlayers);

  const isHost = useMemo(() => hostPeerId && localPeerId && hostPeerId === localPeerId, [hostPeerId, localPeerId]);
  const readyCount = readyPeerIds.length;

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
    if (!wsRef.current || !currentQuestion || hasAnsweredCurrent || quizStatus !== "playing") {
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
  }, [currentQuestion, hasAnsweredCurrent, isRoomPublic, quizStatus, roomId]);

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
          break;
        case "answerAccepted":
          if (data?.alreadyAnswered) {
            setHasAnsweredCurrent(true);
          }
          break;
        case "questionResult":
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
        <QuizNameCard quizId={quizId} />

        {quizStatus === "finished" ? (
          <section className="mb-6 flex flex-col gap-4 text-foreground bg-background/60 shadow-2xl p-4 xs:p-6 rounded-2xl overflow-hidden relative">
            <AnimatePresence>
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 24 }).map((_, index) => (
                  <motion.span
                    key={`confetti-${index}`}
                    className="absolute w-2 h-2 rounded-full bg-amber-300"
                    initial={{ x: `${Math.random() * 100}%`, y: -20, opacity: 0.8 }}
                    animate={{ y: "120%", opacity: 0.2, rotate: 360 }}
                    transition={{ duration: 2 + Math.random() * 1.5, repeat: Infinity, delay: index * 0.04 }}
                  />
                ))}
              </div>
            </AnimatePresence>
            <div className="relative z-10">
              <h1 className="text-2xl xs:text-3xl font-semibold flex items-center gap-2">
                <Sparkles className="text-amber-300" /> Quiz Complete
              </h1>
              <p className="opacity-85">Final top 3</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {topThree.map((player, index) => (
                  <motion.div
                    key={player.peerId}
                    initial={{ scale: 0.5, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (index * 0.2), type: "spring" }}
                    className="rounded-2xl border border-amber-300/50 bg-amber-500/15 p-3 text-center"
                  >
                    <p className="text-xs uppercase opacity-75">#{index + 1}</p>
                    <p className="font-semibold">{player.playerName}</p>
                    <p className="text-sm">{player.score} pts</p>
                  </motion.div>
                ))}
              </div>
              <Button className="mt-4" color="secondary" onClick={() => setIsLeaderboardOpen(true)}>
                View Leaderboard
              </Button>
            </div>
          </section>
        ) : (
          <section className="mb-6 flex flex-col gap-3 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl overflow-y-auto">
            <div className="flex flex-row justify-between items-center mb-1 pr-1 gap-2">
              <h1 className="text-xl xs:text-2xl font-semibold">Quiz Room</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="flat"
                  radius="sm"
                  startContent={<Trophy size={18} />}
                  onClick={() => setIsLeaderboardOpen(true)}
                >
                  Leaderboard
                </Button>
                <TextChatInterface localPeerId={localPeerId} localPlayerName={playerName} />
              </div>
            </div>

            {quizStatus === "waiting" ? (
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
            ) : (
              <div className="rounded-xl border border-background/20 bg-background/10 p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Question {questionIndex}/{totalQuestions}</p>
                  <p className="text-sm flex items-center gap-1"><Timer size={16} /> {(timeRemainingMs / 1000).toFixed(1)}s</p>
                </div>
                <div className="h-2 rounded-full bg-background/20 overflow-hidden">
                  <div className="h-2 bg-amber-300 transition-all duration-100" style={{ width: `${timerPercent}%` }} />
                </div>
                {currentQuestion ? (
                  <>
                    <p className="text-lg font-medium">{currentQuestion.questionText}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentQuestion.options?.map((option) => (
                        <li key={option.optionId}>
                          <button
                            type="button"
                            onClick={() => handleSubmitAnswer(option.optionId)}
                            disabled={hasAnsweredCurrent || correctOptionId !== null}
                            className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${optionClassName(option.optionId)}`}
                          >
                            {option.optionText || `Option ${option.optionId}`}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {hasAnsweredCurrent && correctOptionId === null ? (
                      <p className="text-sm opacity-80">Answer locked. Waiting for timer to end.</p>
                    ) : null}
                    {roundResults.length > 0 ? (
                      <p className="text-sm font-medium">
                        {roundResults.find((result) => result.peerId === localPeerId)?.isCorrect
                          ? `Correct! +${roundResults.find((result) => result.peerId === localPeerId)?.pointsAwarded || 0} pts`
                          : "Round result is out."}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm opacity-80">Preparing next question...</p>
                )}
              </div>
            )}

            <ul className={"flex flex-col gap-2 pr-1 rounded-2xl overflow-y-auto"}>
              <li className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
                <AudioDeviceManager {...{
                  selectedAudioDevice,
                  setSelectedAudioDevice,
                  isLocalPlayerMute,
                  setIsLocalPlayerMute
                }}
                />
                <h2 className={"flex-1 text-center"}>{localPlayerRow.playerName}</h2>
              </li>
              {Object.entries(roomPlayers).map(([key, value], ind) => (
                <li
                  key={ind}
                  className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl"
                >
                  <Button variant={"flat"} size={"sm"} isIconOnly>
                    {value?.isMute ? <MicOff size={22} /> : <Mic size={22} />}
                  </Button>
                  <h2 className={"flex-1 text-center"}>{value?.playerName}</h2>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onOpenChange={(open) => setIsLeaderboardOpen(open)}
        leaderboard={leaderboard}
      />
    </section>
  );
}
