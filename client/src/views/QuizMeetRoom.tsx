import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Crown, Mic, MicOff, Trophy, Pencil, FastForward, Share2, Check } from "lucide-react";
import { MEDIA_CONSTRAINTS } from "../config/mediaConfig";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { addUpdateRoomPlayer } from "../store/features/roomSlice";
import TextChatInterface from "../components/quiz-meet-room/TextChatInterface";
import QuizPlayRoom from "./QuizPlayRoom";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal";
import useAudioActivity from "../hooks/useAudioActivity";
import { LeaderboardModal } from "../components/quiz-meet-room/LeaderboardModal";
import { useQuizWebSocket } from "../hooks/useQuizWebSocket";

export default function QuizMeetRoom() {
  const dispatch = useDispatch();
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const navigate = useNavigate();
  const { quizId, roomId } = useParams<{ quizId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState<boolean>(searchParams.get("public") === "true");
  
  const {
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
  } = useQuizWebSocket(roomId, Number(quizId), isRoomPublic, webSocketUrl);

  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState<boolean>(true);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);

  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<number | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream>(new MediaStream());
  const isSpeaking = useAudioActivity(localStream);
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);

  const isHost = useMemo(() => hostPeerId && localPeerId && hostPeerId === localPeerId, [hostPeerId, localPeerId]);
  const isReadyToStart = useMemo(() => localPeerId ? readyPeerIds.includes(localPeerId) : false, [localPeerId, readyPeerIds]);

  const handleShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  }, []);

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
    sendJson({
      event: "readyToStart",
      roomId,
      isRoomPublic,
      readyToStart: nextReady
    });
  }, [isRoomPublic, isHost, isReadyToStart, roomId, sendJson]);

  const handleSubmitAnswer = useCallback((optionId: number) => {
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

  // Handle updates to hasAnsweredCurrent when question changes
  useEffect(() => {
    setHasAnsweredCurrent(false);
    setSelectedOptionId(null);
    setCorrectOptionId(null);
  }, [currentQuestion]);

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
