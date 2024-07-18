import { useParams } from "react-router-dom";
import { useGetQuizByIdQuery } from "../store/api/quizzesApi";

export default function QuizMeetRoom() {
  const { quizId, roomId } = useParams();

  return <div>QuizMeetRoom</div>;
}
