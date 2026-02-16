import { Button } from "@nextui-org/react";
import { Sparkles, Timer, Crown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function QuizPlayRoom({
  quizStatus,
  currentQuestion,
  questionIndex,
  totalQuestions,
  timeRemainingMs,
  questionDurationMs,
  timerPercent,
  roundResults,
  topThree,
  localPeerId,
  handleSubmitAnswer,
  hasAnsweredCurrent,
  selectedOptionId,
  correctOptionId,
  setIsLeaderboardOpen
}) {
  const successAudio = useRef(new Audio("/sound-effects/success-yipee.mp3"));
  const failAudio = useRef(new Audio("/sound-effects/fail-trumpet.mp3"));
  const celebrationAudio = useRef(new Audio("/sound-effects/celebration-trumpets.mp3"));

  useEffect(() => {
    successAudio.current.volume = 0.5;
    failAudio.current.volume = 0.5;
    celebrationAudio.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (roundResults.length > 0) {
      const myResult = roundResults.find((r) => r.peerId === localPeerId);
      if (myResult) {
        if (myResult.isCorrect) {
          successAudio.current.currentTime = 0;
          successAudio.current.play().catch((e) => console.log("Audio play failed", e));
        } else {
          failAudio.current.currentTime = 0;
          failAudio.current.play().catch((e) => console.log("Audio play failed", e));
        }
      }
    }
  }, [roundResults, localPeerId]);

  useEffect(() => {
    if (quizStatus === "finished") {
      const isTotalFailure = !topThree || topThree.length === 0 || (topThree[0] && topThree[0].score === 0);
      if (!isTotalFailure) {
        celebrationAudio.current.currentTime = 0;
        celebrationAudio.current.play().catch((e) => console.log("Audio play failed", e));
      } else {
        failAudio.current.currentTime = 0;
        failAudio.current.play().catch((e) => console.log("Audio play failed", e));
      }
    }
  }, [quizStatus, topThree]);

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

  const getTimerColor = () => {
    if (timerPercent > 60) return "bg-green-500";
    if (timerPercent > 40) return "bg-lime-400";
    if (timerPercent > 20) return "bg-yellow-400";
    return "bg-red-500";
  };

  if (quizStatus === "finished") {
    // Check if the top player has 0 score (meaning everyone has 0 or worse, essentially all losers)
    // or if the topThree list is empty/undefined.
    const isTotalFailure = !topThree || topThree.length === 0 || (topThree[0] && topThree[0].score === 0);

    return (
      <div className="flex flex-col gap-4 relative overflow-hidden p-4 rounded-xl border border-background/20 bg-background/10 min-h-[400px]">
        {/* Celebration Confetti - Only show if not a total failure */}
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
            {isTotalFailure ? (
              <span className="text-red-400">💀 Game Over</span>
            ) : (
              <>
                <Sparkles className="text-amber-300" /> Quiz Complete
              </>
            )}
          </h1>
          
          {isTotalFailure ? (
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex flex-col items-center justify-center my-8 p-6 border-2 border-dashed border-red-500/30 rounded-2xl bg-red-500/10"
             >
                <p className="text-4xl mb-2">🤡</p>
                <p className="text-xl font-bold text-red-300 text-center uppercase tracking-widest" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Seriously?
                </p>
                <p className="text-lg text-red-200/80 text-center mt-1">
                  You all are losers!
                </p>
                <p className="text-sm opacity-50 mt-4 text-center">0 pts for everyone. Impressive.</p>
             </motion.div>
          ) : (
            <>
              <p className="opacity-85 mb-6">Final top 3</p>
              <div className="flex justify-center items-end gap-2 sm:gap-4 w-full h-48 sm:h-56 px-4">
                 {/* Second Place */}
                 {topThree[1] && (
                   <motion.div
                     initial={{ scale: 0.5, opacity: 0, y: 50 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     transition={{ delay: 0.4, type: "spring" }}
                     className="flex flex-col items-center justify-end w-1/3 sm:w-1/4"
                   >
                     <div className="w-full bg-background/20 border-t-4 border-slate-300 rounded-t-xl p-3 flex flex-col items-center justify-center h-32 sm:h-36">
                       <p className="text-xs uppercase font-bold text-slate-300 mb-1">2nd</p>
                       <p className="font-bold text-sm sm:text-base text-center line-clamp-2">{topThree[1].playerName}</p>
                       <p className="text-xs opacity-80">{topThree[1].score} pts</p>
                     </div>
                   </motion.div>
                 )}
    
                 {/* First Place */}
                 {topThree[0] && (
                   <motion.div
                     initial={{ scale: 0.5, opacity: 0, y: 50 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     transition={{ delay: 0.2, type: "spring" }}
                     className="flex flex-col items-center justify-end w-1/3 sm:w-1/4 z-10"
                   >
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
    
                 {/* Third Place */}
                 {topThree[2] && (
                   <motion.div
                     initial={{ scale: 0.5, opacity: 0, y: 50 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     transition={{ delay: 0.6, type: "spring" }}
                     className="flex flex-col items-center justify-end w-1/3 sm:w-1/4"
                   >
                     <div className="w-full bg-background/20 border-t-4 border-amber-700/60 rounded-t-xl p-3 flex flex-col items-center justify-center h-24 sm:h-28">
                       <p className="text-xs uppercase font-bold text-amber-700 mb-1">3rd</p>
                       <p className="font-bold text-xs sm:text-sm text-center line-clamp-2">{topThree[2].playerName}</p>
                       <p className="text-xs opacity-80">{topThree[2].score} pts</p>
                     </div>
                   </motion.div>
                 )}
              </div>
            </>
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
        <p className="text-sm font-medium">Question {questionIndex}/{totalQuestions}</p>
        <p className="text-sm flex items-center gap-1"><Timer size={16} /> {(timeRemainingMs / 1000).toFixed(1)}s</p>
      </div>
      <div className="h-2 rounded-full bg-background/20 overflow-hidden">
        <div className={`h-2 transition-all duration-100 ${getTimerColor()}`} style={{ width: `${timerPercent}%` }} />
      </div>
      {currentQuestion ? (
        <>
          {currentQuestion.imageUrl && (
            <div className="w-full flex justify-center mb-4">
              <img
                src={currentQuestion.imageUrl}
                alt="Question Image"
                className="rounded-lg max-h-60 object-contain"
              />
            </div>
          )}
          
          {currentQuestion.audioUrl && (
            <div className="w-full flex justify-center mb-4">
               <audio controls autoPlay className="w-full">
                  <source src={currentQuestion.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
               </audio>
            </div>
          )}

          <p className="text-lg font-medium">{currentQuestion.questionText}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentQuestion.options?.map((option) => (
              <li key={option.optionId}>
                <button
                  type="button"
                  onClick={() => handleSubmitAnswer(option.optionId)}
                  disabled={correctOptionId !== null}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition-colors flex flex-col gap-2 ${optionClassName(option.optionId)}`}
                >
                   {option.imageUrl && (
                    <img
                      src={option.imageUrl}
                      alt="Option Image"
                      className="rounded-md max-h-32 object-contain self-center"
                    />
                  )}
                  {option.audioUrl && (
                    <audio controls className="w-full">
                       <source src={option.audioUrl} type="audio/mpeg" />
                    </audio>
                  )}
                  <span>{option.optionText || `Option ${option.optionId}`}</span>
                </button>
              </li>
            ))}
          </ul>

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
  );
}
