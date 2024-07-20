import { useParams } from "react-router-dom";
import { useGetQuizByIdQuery } from "../store/api/quizzesApi";
import { useGetRoomDetailsByIdQuery } from "../store/api/roomsApi";
import { Link } from "@nextui-org/link";
import { Button } from "@nextui-org/button";
import NavbarComponent from "../components/ui/Navbar";
import { useEffect, useRef } from "react";

export default function QuizMeetRoom() {
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const { quizId, roomId } = useParams();
  const {
    data: quizData,
    error: quizError,
    isLoading: quizLoading,
  } = useGetQuizByIdQuery(quizId);

  const wsRef = useRef(null);

  // WebSocket connection setup
  useEffect(() => {
    wsRef.current = new WebSocket(webSocketUrl);

    wsRef.current.onopen = () => {
      console.log("Connected to web socket");
      wsRef.current.send(
        JSON.stringify({
          roomId,
          quizId,
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
    };

    wsRef.current.onclose = () => {
      console.log("Connection closed");
    };

    wsRef.current.onerror = (error) => {
      console.log(error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [quizId, roomId, webSocketUrl]);

  return (
    <section className="min-w-screen">
      <NavbarComponent />
      <article className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col">
        {quizError ? (
          <p>{quizError.message}</p>
        ) : quizLoading ? (
          <p>Loading...</p>
        ) : quizData ? (
          <div className="flex flex-col gap-2 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-5 xs:p-7 rounded-2xl">
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
                className="py-0 px-2 border-1 h-6"
              >
                View Quiz...
              </Button>
            </p>
          </div>
        ) : null}
      </article>
    </section>
  );
}
