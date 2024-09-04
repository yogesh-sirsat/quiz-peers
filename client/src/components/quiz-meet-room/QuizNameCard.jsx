import { Button } from "@nextui-org/button";
import { Modal, useDisclosure } from "@nextui-org/modal";
import QuizModalContent from "./QuizModalContent";
import { useGetQuizByIdQuery } from "../../store/api/quizzesApi";
import PropTypes from "prop-types";

export default function QuizNameCard({ quizId }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    data: quizData,
    error: quizError,
    isLoading: quizLoading,
  } = useGetQuizByIdQuery(quizId);

  return (
    <>
      {quizError ? (
        <p>{quizError.message}</p>
      ) : quizLoading ? (
        <p>Loading...</p>
      ) : quizData ? (
        <div className="flex flex-col gap-2 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-semibold">
            {quizData?.quiz_name}
          </h1>
          <p className="text-sm">
            <span>{quizData?.description} </span>
            <Button
              size="sm"
              color="secondary"
              radius="full"
              variant="ghost"
              className="py-0 px-2 border-1 h-6 ml-2"
              onClick={onOpen}
            >
              View Quiz...
            </Button>
          </p>
          <Modal
            size={"xl"}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            scrollBehavior="inside"
            placement="center"
            classNames={{
              closeButton: "hover:bg-background/30 active:bg-background/25",
            }}
          >
            <QuizModalContent quizData={quizData} />
          </Modal>
        </div>
      ) : null}
    </>
  );
}

QuizNameCard.propTypes = {
  quizId: PropTypes.string,
};
