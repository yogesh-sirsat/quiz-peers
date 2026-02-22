import { useParams, useSearchParams } from "react-router-dom";
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
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
import { GameMode } from "../types";

export default function QuizMeetRoom() {
  const dispatch = useDispatch();
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const { quizId, roomId } = useParams<{ quizId: string; roomId: string }>();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState<boolean>(searchParams.get("public") === "true");
  const requestedMode: GameMode = searchParams.get("mode") === "SIMILARITY" ? "SIMILARITY" : "TRIVIA";
  const requestedSimilarityCount = Number(searchParams.get("count") || 10);
  
  const {
    playerName,
    localPeerId,
    hostPeerId,
    readyPeerIds,
    totalPlayers,
    quizStatus,
    gameMode,
    currentQuestion,
    questionIndex,
    totalQuestions,
    questionEndsAt,
    questionDurationMs,
    correctOptionId,
    leaderboard,
    roundResults,
    topThree,
    similarityResult,
    skipCount,
    isAutoPlay,
    isWsConnected,
    roomError,
    sendJson,
  } = useQuizWebSocket(roomId, Number(quizId), isRoomPublic, webSocketUrl, requestedMode, requestedSimilarityCount);

  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState<boolean>(true);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false);

  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [hasVotedToSkip, setHasVotedToSkip] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<HTMLAudioElement>(null);
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

  const handleToggleAutoPlay = useCallback(() => {
    const nextAutoPlay = !isAutoPlay;
    sendJson({
      event: "toggleAutoPlay",
      roomId,
      isRoomPublic,
      isAutoPlay: nextAutoPlay
    });
  }, [isAutoPlay, isRoomPublic, roomId, sendJson]);

  const handleNextQuestion = useCallback(() => {
    sendJson({
      event: "nextQuestion",
      roomId,
      isRoomPublic
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
        if (localStreamRef.current) {
          localStreamRef.current.srcObject = currentLocalStream;
          localStreamRef.current.muted = true;
        }
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
    };
  }, [selectedAudioDevice, localStream]);

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
    setHasVotedToSkip(true);
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

  const similarityPlayers = useMemo(() => {
    const rows: Array<{ peerId: string; playerName: string; isMute: boolean; isSpeaking: boolean }> = [];
    if (localPeerId) {
      rows.push({
        peerId: localPeerId,
        playerName: `${playerName || "Player"} (You)`,
        isMute: isLocalPlayerMute,
        isSpeaking: !isLocalPlayerMute && isSpeaking
      });
    }

    Object.entries(roomPlayers).forEach(([peerId, value]) => {
      if (!peerId || peerId === "undefined" || peerId === localPeerId) return;
      rows.push({
        peerId,
        playerName: value?.playerName || "Player",
        isMute: Boolean(value?.isMute),
        isSpeaking: Boolean(value?.isSpeaking)
      });
    });
    return rows;
  }, [isLocalPlayerMute, isSpeaking, localPeerId, playerName, roomPlayers]);

  const timerPercent = useMemo(() => {
    if (!questionEndsAt || quizStatus !== "playing") {
      return 0;
    }
    return Math.max(0, Math.min(100, (timeRemainingMs / questionDurationMs) * 100));
  }, [questionDurationMs, questionEndsAt, quizStatus, timeRemainingMs]);

  // Handle updates to hasAnsweredCurrent when question changes
  useEffect(() => {
    setHasAnsweredCurrent(false);
    setHasVotedToSkip(false);
    setSelectedOptionId(null);
  }, [currentQuestion]);

  return (
    <section className="w-screen min-h-screen max-h-screen flex flex-col overflow-y-auto">
      <NavbarComponent />
      <article
        className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col overflow-y-auto">
        {quizStatus === "waiting" && gameMode === "TRIVIA" && <QuizNameCard quizId={Number(quizId)} />}
        {quizStatus === "waiting" && gameMode === "SIMILARITY" && (
          <div className="text-foreground flex flex-col gap-2 bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-semibold">Similarity Quiz Room</h1>
            <p className="text-sm opacity-80">Random questions: {Math.max(1, Math.min(20, requestedSimilarityCount || 10))}</p>
          </div>
        )}

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
                  variant={hasVotedToSkip ? "solid" : "flat"}
                  color={"warning"}
                  size="sm"
                  startContent={hasVotedToSkip ? <Check size={18} /> : <FastForward size={18} />}
                  onClick={handleSkipTimer}
                  isDisabled={hasVotedToSkip}
                  className="font-semibold min-w-0 px-3"
                >
                  <span className="hidden xs:inline">{hasVotedToSkip ? "Skipped" : "Skip Timer"}</span> ({skipCount}/{totalPlayers})
                </Button>
              )}
              {gameMode === "TRIVIA" ? (
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
              ) : (
                <Button
                  variant="flat"
                  radius="sm"
                  size="sm"
                  startContent={<Trophy size={18} />}
                  onClick={() => setIsPlayersModalOpen(true)}
                  className="min-w-0 px-3"
                  isDisabled={quizStatus !== "playing" && quizStatus !== "finished"}
                >
                  <span className="hidden xs:inline">Players: {totalPlayers}</span>
                </Button>
              )}
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
                <div className="flex flex-col gap-2 w-full xs:w-auto">
                  {!isRoomPublic && isHost && (
                    <div className="flex items-center justify-between gap-4 bg-background/20 p-2 px-3 rounded-xl border border-background/10 mb-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase opacity-60 leading-none">Progression</span>
                        <span className="text-xs font-bold whitespace-nowrap">Auto-play</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="flat" 
                        isIconOnly
                        radius="full"
                        color={isAutoPlay ? "success" : "default"}
                        onClick={handleToggleAutoPlay}
                        className="h-6 w-10 min-w-10 text-[10px] font-black"
                      >
                        {isAutoPlay ? "ON" : "OFF"}
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
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
            {quizStatus === "waiting" && Object.entries(roomPlayers).map(([key, value]) => (
               key && key !== "undefined" && key !== localPeerId && (
              <li
                key={key}
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
              gameMode={gameMode}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              timeRemainingMs={timeRemainingMs}
              timerPercent={timerPercent}
              roundResults={roundResults}
              topThree={topThree}
              similarityResult={similarityResult}
              localPeerId={localPeerId || ""}
              totalPlayers={totalPlayers}
              handleSubmitAnswer={handleSubmitAnswer}
              selectedOptionId={selectedOptionId}
              correctOptionId={correctOptionId}
              setIsLeaderboardOpen={setIsLeaderboardOpen}
              isAutoPlay={isAutoPlay}
              isHost={isHost || false}
              handleNextQuestion={handleNextQuestion}
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

      <Modal
        size="lg"
        isOpen={isPlayersModalOpen}
        onOpenChange={(open) => setIsPlayersModalOpen(open)}
        placement="center"
      >
        <ModalContent className="text-foreground bg-[#AF99B8]">
          <ModalHeader className="text-2xl">Players</ModalHeader>
          <ModalBody className="pb-6">
            <ul className="flex flex-col gap-2">
              {similarityPlayers.length === 0 ? (
                <li className="text-sm opacity-80">No players available.</li>
              ) : (
                similarityPlayers.map((player) => (
                  <li
                    key={player.peerId}
                    className="flex items-center justify-between rounded-xl px-3 py-2 bg-background/10 border border-background/20"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="light"
                        size="sm"
                        isIconOnly
                        onClick={() => toggleMute(player.peerId, player.isMute)}
                        className={player.isSpeaking ? "border-2 border-green-500" : ""}
                      >
                        {player.isMute ? <MicOff size={16} /> : <Mic size={16} />}
                      </Button>
                      <p className="font-medium">{player.playerName}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      <PlayerNameModal
        isOpen={isNameModalOpen}
        onOpenChange={(open) => setIsNameModalOpen(open)}
        currentName={playerName}
        onSave={handleSaveName}
      />
    </section>
  );
}
