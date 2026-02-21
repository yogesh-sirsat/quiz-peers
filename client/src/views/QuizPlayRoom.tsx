import { Button, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@nextui-org/react";
import { Sparkles, Timer, Crown, Music, Play, Pause, FastForward } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameMode, QuizQuestion, SimilaritySessionResult } from "../types";

interface AudioPlayerProps {
  audioUrl: string;
  compact?: boolean;
}

function AudioPlayer({ audioUrl, compact }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    audioRef.current.onended = () => setIsPlaying(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-2 bg-background/20 p-2 rounded-xl border border-background/10 w-full ${compact ? "py-1" : ""}`}>
      <div className="p-1.5 bg-primary/20 text-primary rounded-lg shrink-0">
        <Music size={compact ? 14 : 18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase opacity-50 leading-none mb-0.5 truncate">Audio</p>
      </div>
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        color={isPlaying ? "secondary" : "primary"}
        onClick={togglePlay}
        className="shrink-0 h-8 w-8 min-w-8"
      >
        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </Button>
    </div>
  );
}

interface RoundResult {
  peerId: string;
  isCorrect: boolean | null;
  pointsAwarded?: number;
  selectedOptionId?: number | null;
}

interface QuizPlayRoomProps {
  quizStatus: string;
  gameMode: GameMode;
  currentQuestion: QuizQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number;
  timerPercent: number;
  roundResults: RoundResult[];
  topThree: any[];
  similarityResult: SimilaritySessionResult | null;
  localPeerId: string;
  handleSubmitAnswer: (optionId: number) => void;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  setIsLeaderboardOpen: (open: boolean) => void;
  isAutoPlay: boolean;
  isHost: boolean;
  handleNextQuestion: () => void;
}

function SimilarityFinishedView({
  similarityResult,
  localPeerId
}: {
  similarityResult: SimilaritySessionResult | null;
  localPeerId: string;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [modalPlayers, setModalPlayers] = useState<Array<{ peerId: string; playerName: string }>>([]);
  const [modalTitle, setModalTitle] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    setPageIndex(0);
  }, [similarityResult]);

  if (!similarityResult) {
    return <p className="text-sm opacity-80">No similarity insights available.</p>;
  }

  const questionPages = similarityResult.questionBreakdown || [];
  const totalPages = 3 + questionPages.length;
  const currentQuestionPageIndex = pageIndex - 2;
  const localRanking = similarityResult.perPlayerSimilarity?.[localPeerId] || [];

  const openPlayersModal = (title: string, players: Array<{ peerId: string; playerName: string }>) => {
    setModalTitle(title);
    setModalPlayers(players);
    onOpen();
  };

  return (
    <div className="rounded-xl border border-background/20 bg-background/10 p-3 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Results {pageIndex + 1}/{totalPages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="flat" isDisabled={pageIndex <= 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>
            Prev
          </Button>
          <Button size="sm" color="primary" isDisabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}>
            Next
          </Button>
        </div>
      </div>

      {pageIndex === 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">Most Matched Pairs</h3>
          {(similarityResult.pairwise || []).slice(0, 12).map((pair, idx) => (
            <div key={`${pair.playerAId}-${pair.playerBId}`} className="rounded-lg border border-background/20 bg-background/10 p-2 text-sm flex justify-between">
              <span>{idx + 1}. {pair.playerAName} + {pair.playerBName}</span>
              <span className="font-semibold">{pair.similarityCount}</span>
            </div>
          ))}
        </div>
      )}

      {pageIndex === 1 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">Public Stats</h3>
          <div className="rounded-lg border border-background/20 bg-background/10 p-3 text-sm">
            Soulmate: {similarityResult.publicStats?.soulmate ? `${similarityResult.publicStats.soulmate.playerAName} + ${similarityResult.publicStats.soulmate.playerBName}` : "N/A"}
          </div>
          <div className="rounded-lg border border-background/20 bg-background/10 p-3 text-sm">
            Lone wolf: {similarityResult.publicStats?.loneWolf?.playerName || "N/A"}
          </div>
          <div className="rounded-lg border border-background/20 bg-background/10 p-3 text-sm">
            Most popular picker: {similarityResult.publicStats?.mostPopularPicker?.playerName || "N/A"}
          </div>
          <div className="rounded-lg border border-background/20 bg-background/10 p-3 text-sm">
            Chaos picker: {similarityResult.publicStats?.chaosPicker?.playerName || "N/A"}
          </div>
        </div>
      )}

      {currentQuestionPageIndex >= 0 && currentQuestionPageIndex < questionPages.length && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold">
            Q{currentQuestionPageIndex + 1}: {questionPages[currentQuestionPageIndex].questionText}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questionPages[currentQuestionPageIndex].options.map((option) => (
              <li
                key={option.optionId}
                className="rounded-xl border-2 border-background/20 bg-background/10 p-3 cursor-pointer"
                onClick={() => openPlayersModal(option.optionText || `Option ${option.optionId}`, option.players)}
              >
                <p className="font-semibold">{option.optionText || `Option ${option.optionId}`}</p>
                <p className="text-xs opacity-70 mt-1">Selected by {option.players.length} player(s)</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {option.players.slice(0, 10).map((player) => (
                    <span key={player.peerId} className="text-[10px] px-2 py-1 rounded-full bg-primary/20">
                      {player.playerName}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pageIndex === totalPages - 1 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">You Matched Most With</h3>
          {(localRanking || []).map((entry, idx) => (
            <div key={entry.peerId} className="rounded-lg border border-background/20 bg-background/10 p-2 text-sm flex justify-between">
              <span>{idx + 1}. {entry.playerName}</span>
              <span className="font-semibold">{entry.similarityCount}</span>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader>{modalTitle}</ModalHeader>
              <ModalBody>
                {modalPlayers.length === 0 ? (
                  <p className="text-sm opacity-70">No players selected this option.</p>
                ) : (
                  <ul className="pb-3">
                    {modalPlayers.map((player) => (
                      <li key={player.peerId} className="py-1 text-sm">{player.playerName}</li>
                    ))}
                  </ul>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default function QuizPlayRoom({
  quizStatus,
  gameMode,
  currentQuestion,
  questionIndex,
  totalQuestions,
  timeRemainingMs,
  timerPercent,
  roundResults,
  topThree,
  similarityResult,
  localPeerId,
  handleSubmitAnswer,
  selectedOptionId,
  correctOptionId,
  setIsLeaderboardOpen,
  isAutoPlay,
  isHost,
  handleNextQuestion
}: QuizPlayRoomProps) {
  const successAudio = useRef(new Audio("/sound-effects/success-yipee.mp3"));
  const failAudio = useRef(new Audio("/sound-effects/fail-trumpet.mp3"));
  const celebrationAudio = useRef(new Audio("/sound-effects/celebration-trumpets.mp3"));

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion?.options) return [];
    return [...currentQuestion.options].sort(() => Math.random() - 0.5);
  }, [currentQuestion?.options]);

  useEffect(() => {
    successAudio.current.volume = 0.5;
    failAudio.current.volume = 0.5;
    celebrationAudio.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (gameMode !== "TRIVIA") return;
    if (roundResults.length > 0) {
      const myResult = roundResults.find((r) => r.peerId === localPeerId);
      if (myResult?.isCorrect) {
        successAudio.current.currentTime = 0;
        successAudio.current.play().catch(() => {});
      } else if (myResult?.isCorrect === false) {
        failAudio.current.currentTime = 0;
        failAudio.current.play().catch(() => {});
      }
    }
  }, [gameMode, roundResults, localPeerId]);

  useEffect(() => {
    if (quizStatus === "finished") {
      if (gameMode === "TRIVIA") {
        const isTotalFailure = !topThree || topThree.length === 0 || (topThree[0] && topThree[0].score === 0);
        if (!isTotalFailure) {
          celebrationAudio.current.currentTime = 0;
          celebrationAudio.current.play().catch(() => {});
        } else {
          failAudio.current.currentTime = 0;
          failAudio.current.play().catch(() => {});
        }
      } else {
        celebrationAudio.current.currentTime = 0;
        celebrationAudio.current.play().catch(() => {});
      }
    }
  }, [gameMode, quizStatus, topThree]);

  const optionClassName = (optionId: number) => {
    if (gameMode === "SIMILARITY") {
      if (Number(selectedOptionId) === optionId) {
        return "border-amber-400 bg-amber-400/20";
      }
      return "border-background/20 bg-background/10 hover:bg-background/20";
    }

    if (correctOptionId !== null) {
      if (optionId === Number(correctOptionId)) {
        return "border-green-500 bg-green-500/20";
      }
      if (optionId === Number(selectedOptionId) && Number(selectedOptionId) !== Number(correctOptionId)) {
        return "border-red-500 bg-red-500/20";
      }
    } else if (Number(selectedOptionId) === optionId) {
      return "border-amber-400 bg-amber-400/20";
    }
    return "border-background/20 bg-background/10 hover:bg-background/20";
  };

  const getTimerColor = () => {
    if (timerPercent > 60) return "bg-green-500";
    if (timerPercent > 40) return "bg-lime-400";
    if (timerPercent > 20) return "bg-yellow-400";
    return "bg-red-500";
  };

  if (quizStatus === "finished") {
    if (gameMode === "SIMILARITY") {
      return <SimilarityFinishedView similarityResult={similarityResult} localPeerId={localPeerId} />;
    }

    const isTotalFailure = !topThree || topThree.length === 0 || (topThree[0] && topThree[0].score === 0);
    return (
      <div className="flex flex-col gap-4 relative overflow-hidden p-4 rounded-xl border border-background/20 bg-background/10 min-h-[400px]">
        {!isTotalFailure && (
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
        )}
        <div className="relative z-10 w-full flex flex-col items-center h-full justify-center">
          <h1 className="text-2xl xs:text-3xl font-semibold flex items-center gap-2 mb-2 text-center">
            {isTotalFailure ? <span className="text-red-400">Game Over</span> : <><Sparkles className="text-amber-300" /> Quiz Complete</>}
          </h1>
          {!isTotalFailure && <p className="opacity-85 mb-6">Final top 3</p>}
          {!isTotalFailure && (
            <div className="flex justify-center items-end gap-2 sm:gap-4 w-full h-48 sm:h-56 px-4">
              {topThree[1] && (
                <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring" }} className="flex flex-col items-center justify-end w-1/3 sm:w-1/4">
                  <div className="w-full bg-background/20 border-t-4 border-slate-300 rounded-t-xl p-3 flex flex-col items-center justify-center h-32 sm:h-36">
                    <p className="text-xs uppercase font-bold text-slate-300 mb-1">2nd</p>
                    <p className="font-bold text-sm sm:text-base text-center line-clamp-2">{topThree[1].playerName}</p>
                    <p className="text-xs opacity-80">{topThree[1].score} pts</p>
                  </div>
                </motion.div>
              )}
              {topThree[0] && (
                <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring" }} className="flex flex-col items-center justify-end w-1/3 sm:w-1/4 z-10">
                  <div className="relative w-full">
                    <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-300 drop-shadow-lg" size={32} />
                    <div className="w-full bg-amber-500/20 border-t-4 border-amber-400 rounded-t-xl p-4 flex flex-col items-center justify-center h-40 sm:h-48 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                      <p className="text-sm uppercase font-bold text-amber-300 mb-1">1st</p>
                      <p className="font-bold text-base sm:text-lg text-center line-clamp-2">{topThree[0].playerName}</p>
                      <p className="text-sm font-semibold">{topThree[0].score} pts</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {topThree[2] && (
                <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.6, type: "spring" }} className="flex flex-col items-center justify-end w-1/3 sm:w-1/4">
                  <div className="w-full bg-background/20 border-t-4 border-amber-700/60 rounded-t-xl p-3 flex flex-col items-center justify-center h-24 sm:h-28">
                    <p className="text-xs uppercase font-bold text-amber-700 mb-1">3rd</p>
                    <p className="font-bold text-xs sm:text-sm text-center line-clamp-2">{topThree[2].playerName}</p>
                    <p className="text-xs opacity-80">{topThree[2].score} pts</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          <Button className="mt-8 z-20" color="secondary" onClick={() => setIsLeaderboardOpen(true)}>
            View Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-background/20 bg-background/10 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{questionIndex}/{totalQuestions}</p>
        <p className="text-sm flex items-center gap-1"><Timer size={16} /> {(timeRemainingMs / 1000).toFixed(1)}s</p>
      </div>
      <div className="h-2 rounded-full bg-background/20 overflow-hidden">
        <div className={`h-2 transition-all duration-100 ${getTimerColor()}`} style={{ width: `${timerPercent}%` }} />
      </div>
      {currentQuestion ? (
        <>
          {currentQuestion.imageUrl && (
            <div className="w-full flex justify-center mb-4 bg-black/5 rounded-xl overflow-hidden h-60">
              <img src={currentQuestion.imageUrl} alt="Question" className="h-full w-full object-contain" />
            </div>
          )}
          {currentQuestion.audioUrl && (
            <div className="w-full flex justify-center mb-4">
              <AudioPlayer audioUrl={currentQuestion.audioUrl} />
            </div>
          )}

          <p className="text-lg font-medium">{currentQuestion.questionText}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledOptions?.map((option) => (
              <li key={option.optionId}>
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer(option.optionId)}
                  disabled={correctOptionId !== null}
                  className={`w-full text-left rounded-xl border-2 px-3 py-3 transition-all flex flex-col gap-3 min-h-[80px] ${optionClassName(option.optionId)}`}
                >
                  {option.imageUrl && (
                    <div className="w-full h-32 bg-black/5 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      <img src={option.imageUrl} alt="Option" className="h-full w-full object-contain" />
                    </div>
                  )}
                  {option.audioUrl && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AudioPlayer audioUrl={option.audioUrl} compact />
                    </div>
                  )}
                  <span className="font-bold text-center sm:text-left">{option.optionText || `Option ${option.optionId}`}</span>
                </button>
              </li>
            ))}
          </ul>

          {roundResults.length > 0 && (gameMode === "SIMILARITY" || correctOptionId !== null) ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              {gameMode === "TRIVIA" ? (
                <p className="text-sm font-bold text-center bg-background/20 py-2 px-4 rounded-lg w-full">
                  {roundResults.find((result) => result.peerId === localPeerId)?.isCorrect
                    ? `Correct! +${roundResults.find((result) => result.peerId === localPeerId)?.pointsAwarded || 0} pts`
                    : "Incorrect. Better luck next time!"}
                </p>
              ) : (
                <p className="text-sm font-bold text-center bg-background/20 py-2 px-4 rounded-lg w-full">
                  Answers locked for this round
                </p>
              )}

              {!isAutoPlay && quizStatus === "playing" && (
                <div className="w-full flex justify-center mt-2">
                  {isHost ? (
                    <Button
                      color="success"
                      variant="solid"
                      onClick={handleNextQuestion}
                      className="font-black w-full h-12 text-lg shadow-lg"
                      startContent={<FastForward size={24} />}
                    >
                      NEXT QUESTION
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-1 opacity-80">
                      <p className="text-sm font-bold animate-pulse text-secondary italic">Waiting for host to proceed...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm opacity-80">Preparing next question...</p>
      )}
    </div>
  );
}
