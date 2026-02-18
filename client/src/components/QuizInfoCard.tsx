import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Chip } from "@nextui-org/chip";
import { Tooltip } from "@nextui-org/react";
import QuizCategories from "./QuizCategories";
import { QuizDTO } from "../types";

interface QuizInfoCardProps {
  quizInfo: QuizDTO;
}

function QuizInfoCard({ quizInfo }: QuizInfoCardProps) {
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
              content={Math.round(quizInfo?.success_rate) + "% Success Rate."}
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
                SR : {Math.round(quizInfo?.success_rate)}%
              </Chip>
            </Tooltip>
          ) : null}
          {quizInfo?.status !== 'published' ? (
            <Chip
              className="absolute z-10 top-2 left-2 min-w-4 min-h-4"
              classNames={{
                base: `${quizInfo?.status === 'testing' ? 'bg-warning-400/80' : 'bg-default-400/80'} text-black border-1 border-black/50`,
                content: "font-bold text-[10px] uppercase"
              }}
              radius="sm"
              size="sm"
              variant="flat"
            >
              {quizInfo?.status}
            </Chip>
          ) : null}
          <div className="absolute z-10 bottom-2 right-2 flex flex-row gap-1">
            <Tooltip
              color="foreground"
              content={Math.round(quizInfo?.contestants_count || 0) + " Times Played"}
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
                Played : {Math.round(quizInfo?.contestants_count || 0)}
              </Chip>
            </Tooltip>
            <Tooltip
              color="foreground"
              content={Math.round(quizInfo?.questions_count || 0) + " Total Questions"}
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
                Qs : {Math.round(quizInfo?.questions_count || 0)}
              </Chip>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-visible py-2 px-4">
        <h3 className="font-semibold text-xl mb-1">{quizInfo?.quiz_name}</h3>
        <QuizCategories categories={quizInfo?.categories} isCard max={3} />
      </CardBody>
    </Card>
  );
}

export default QuizInfoCard;
