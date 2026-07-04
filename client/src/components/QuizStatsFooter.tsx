import { Chip } from "@nextui-org/chip";

interface QuizStatsFooterProps {
  successRate?: string | number;
  contestantsCount: string | number;
  questionsCount: string | number;
}

export default function QuizStatsFooter({
  successRate,
  contestantsCount,
  questionsCount,
}: QuizStatsFooterProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {successRate ? (
        <Chip
          className="min-w-4 min-h-4"
          classNames={{
            base: "bg-green-400/60 text-black border-1 border-black/50",
            content: "font-base xs:font-medium",
          }}
          radius="sm"
          size="sm"
          variant="flat"
        >
          {Math.round(Number(successRate))}% SUCCESS RATE
        </Chip>
      ) : null}
      <Chip
        className="min-w-4 min-h-4"
        classNames={{
          base: "bg-teal-400/50 text-black border-1 border-black/50",
          content: "font-base xs:font-medium",
        }}
        radius="sm"
        size="sm"
        variant="flat"
      >
        {Math.round(Number(contestantsCount))} TIMES PLAYED
      </Chip>
      <Chip
        className="min-w-4 min-h-4"
        classNames={{
          base: "bg-orange-400/50 text-black border-1 border-black/50",
          content: "font-base xs:font-medium",
        }}
        radius="sm"
        size="sm"
        variant="flat"
      >
        {Math.round(Number(questionsCount))} TOTAL QUESTIONS
      </Chip>
    </div>
  );
}
