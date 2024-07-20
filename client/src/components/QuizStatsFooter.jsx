import { Chip } from "@nextui-org/chip";
import PropTypes from "prop-types";

export default function QuizStatsFooter({
  successRate,
  contestantsCount,
  questionsCount,
}) {
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
          {successRate}% SUCCESS RATE
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
        {contestantsCount} TIMES PLAYED
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
        {questionsCount} TOTAL QUESTIONS
      </Chip>
    </div>
  );
}

QuizStatsFooter.propTypes = {
  successRate: PropTypes.number,
  contestantsCount: PropTypes.number,
  questionsCount: PropTypes.number,
};
