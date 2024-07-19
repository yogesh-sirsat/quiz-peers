import { useParams } from "react-router-dom";
import { useGetQuizByIdQuery } from "../store/api/quizzesApi";
import NavbarComponent from "../components/ui/Navbar";

export default function QuizMeetRoom() {
  const { quizId, roomId } = useParams();

  return (
    <article className="min-w-screen">
      <NavbarComponent />
      QuizMeetRoom
    </article>
  );
}
