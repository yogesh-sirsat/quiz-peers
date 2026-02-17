import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Chip } from "@nextui-org/chip";
import PropTypes from "prop-types";
import { Tooltip } from "@nextui-org/react";
import QuizCategories from "./QuizCategories";

function QuizInfoCard({ quizInfo }) {
  return (
    <Card className="h-full py-2 bg-background/60 shadow-2xl" isBlurred>
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
        <div className="relative">
          <Image
            alt={quizInfo?.quiz_name + " cover image"}
            className="object-contain rounded-xl h-48 w-full bg-black/5"
            src={quizInfo?.cover_image_url}
            isBlurred
            isZoomed
          />
          {quizInfo?.success_rate ? (
            <Tooltip
              color="foreground"
              content={quizInfo?.success_rate + "% Success Rate."}
            >
              <Chip
                className="absolute z-10 bottom-2 left-2 min-w-4 min-h-4 cursor-pointer"
                classNames={{
                  base: "bg-green-400/60 text-black border-1 border-black/50",
                  content: "font-medium"
                }}
                radius="sm"
                size="sm"
                variant="flat"
              >
                SR : {quizInfo?.success_rate}%
              </Chip>
            </Tooltip>
          ) : null}
          <div className="absolute z-10 bottom-2 right-2 flex flex-row gap-1">
            <Tooltip
              color="foreground"
              content={quizInfo?.contestants_count + " Times Played"}
            >
              <Chip
                className="min-w-4 min-h-4 cursor-pointer"
                classNames={{
                  base: "bg-teal-400/50 text-black border-1 border-black/50",
                  content: "font-medium"
                }}
                radius="sm"
                size="sm"
                variant="flat"
              >
                Played : {quizInfo?.contestants_count}
              </Chip>
            </Tooltip>
            <Tooltip
              color="foreground"
              content={quizInfo?.questions_count + " Total Questions"}
            >
              <Chip
                className="min-w-4 min-h-4 cursor-pointer"
                classNames={{
                  base: "bg-orange-400/50 text-black border-1 border-black/50",
                  content: "font-medium"
                }}
                radius="sm"
                size="sm"
                variant="flat"
              >
                Qs : {quizInfo?.questions_count}
              </Chip>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-visible py-2 px-4">
        <h3 className="font-semibold text-xl mb-1">{quizInfo?.quiz_name}</h3>
        <QuizCategories categories={quizInfo?.categories} isCard />
      </CardBody>
    </Card>
  );
}

QuizInfoCard.propTypes = {
  quizInfo: PropTypes.object
};

export default QuizInfoCard;
