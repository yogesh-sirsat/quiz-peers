import { ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Image } from "@nextui-org/image";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import QuizStatsFooter from "../QuizStatsFooter";
import QuizCategories from "../QuizCategories";

export default function QuizModalContent({ quizData }) {
  dayjs.extend(relativeTime);

  return (
    <ModalContent className="text-foreground bg-[#AF99B8]">
      <ModalHeader className="flex flex-col text-2xl xs:text-3xl gap-1">
        Quiz Details
      </ModalHeader>
      <ModalBody className="px-6 xs:px-8 pt-4 pb-6 xs:py-6">
        <Image isBlurred isZoomed src={quizData?.cover_image_url} />
        <div className="flex flex-col gap-1 xs:gap-2 pt-4">
          <h1 className="font-semibold text-2xl xs:text-3xl sm:text-4xl break-words">
            {quizData?.quiz_name}
          </h1>

          <p className="text-sm xs:text-base">{quizData?.description}</p>
          <QuizCategories categories={quizData?.categories} />
          <p className="text-xs xs:text-sm">
            Created {dayjs(quizData?.created_at).fromNow()} | Last updated{" "}
            {dayjs(quizData?.updated_at).fromNow()}
          </p>
          <br></br>
          <QuizStatsFooter
            {...{
              successRate: quizData?.success_rate,
              contestantsCount: quizData?.contestants_count,
              questionsCount: quizData?.questions_count,
            }}
          />
        </div>
      </ModalBody>
    </ModalContent>
  );
}

QuizModalContent.propTypes = {
  quizData: PropTypes.object,
};
