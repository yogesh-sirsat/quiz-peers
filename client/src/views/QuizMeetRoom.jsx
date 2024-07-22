import { useParams } from "react-router-dom";
import { Button } from "@nextui-org/button";
import NavbarComponent from "../components/ui/Navbar";
import { useEffect, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Modal, useDisclosure } from "@nextui-org/modal";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal";
import { Microphone } from "../components/icons";

export default function QuizMeetRoom() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const { quizId, roomId } = useParams();
  const [roomError, setRoomError] = useState(null);
  const [playerName, setPlayerName] = useState(null);

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
          event: "generatePlayerName",
          isRoomPublic: true
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      switch (data?.event) {
        case "roomError":
          setRoomError(data?.message);
          break;
        case "playerNameGenerated":
          setPlayerName(data?.playerName);
          wsRef.current.send(
            JSON.stringify({
              roomId,
              quizId,
              event: "joinPublicRoom",
              playerName: data?.playerName
            })
          );
          break;
        case "generatePlayerNameFailed":
          setRoomError(data?.message);
          break;
        default:
          break;
      }
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
        <QuizNameCard quizId={quizId} />
        <section className="flex flex-col gap-2 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-5 xs:p-7 rounded-2xl">
          <h1 className="text-xl xs:text-2xl font-semibold">Quiz Room Players</h1>
          <div className="flex flex-row gap-2 p-2 h-16 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
            <Button
              // color="primary"
              onClick={() => {
                onOpenChange(true);
              }}
              isIconOnly
            >
              <Microphone />
            </Button>
            <h2>{playerName}</h2>
          </div>
        </section>
      </article>
      <Modal
        size={"xl"}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
        placement="center"
        classNames={{
          closeButton: "hover:bg-background/30 active:bg-background/25"
        }}
      >
        <PlayerNameModal />
      </Modal>
    </section>
  );
}
