import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, ButtonGroup } from "@nextui-org/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@nextui-org/dropdown";
import NavbarComponent from "../components/ui/Navbar";
import { useEffect, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import { Modal, useDisclosure } from "@nextui-org/modal";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal";
import { ChevronDown, Mic } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import MEDIA_CONSTRAINTS from "../config/mediaConfig.js";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager.jsx";

export default function QuizMeetRoom() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const navigate = useNavigate();
  const { quizId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState(
    searchParams.get("public") === "true"
  );
  const [roomError, setRoomError] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const peerRef = useRef(null);
  const [remoteRoomPlayers, setRemoteRoomPlayers] = useState([]);

  const wsRef = useRef(null);

  useEffect(() => {
    const isPublicParams = searchParams.get("public");
    if (isPublicParams) {
      setIsRoomPublic(isPublicParams === "true");
    } else {
      navigate("/pagenotfound");
    }
  }, [navigate, searchParams]);

  useEffect(() => {

  });

  // WebSocket connection setup
  useEffect(() => {
    wsRef.current = new WebSocket(webSocketUrl);
    const peerId = uuidv4();
    peerRef.current = new Peer(peerId, {
      secure: false,
      debug: 3,
      config: {
        iceServers: [
          // More stun/turn servers slows down connection discovery
          { urls: "stun:stun.l.google.com:19302" },
          // {
          //   urls: "stun:stun.relay.metered.ca:80",
          // },
          {
            urls: "turn:freeturn.net:3478", // UDP/TCP
            username: "free",
            credential: "free"
          },
          {
            urls: "turns:freeturn.net:5349", // TLS
            username: "free",
            credential: "free"
          }
        ]
      }
    });

    peerRef.current.on("open", () => {
      console.log("Connected to peer");
      console.log(peerRef.current.id);
    });

    wsRef.current.onopen = () => {
      console.log("Connected to web socket");
      wsRef.current.send(
        JSON.stringify({
          roomId,
          quizId,
          peerId: peerRef.current.id,
          event: "joinRoom",
          isRoomPublic
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
        case "joinRoomSuccess":
          setPlayerName(data?.playerName);
          break;
        case "joinRoomFailed":
          setRoomError(data?.message);
          break;
        default:
          break;
      }
    };

    peerRef.current.on("call", (call) => {
      call.answer();
      call.on("stream", (remoteStream) => {
      });
    });

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
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [isRoomPublic, peerRef, quizId, roomId, webSocketUrl]);

  useEffect(() => {
    if (roomError) {
      alert(roomError);
    }
  }, [roomError]);

  return (
    <section className="min-w-screen">
      <NavbarComponent />

      <article
        className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col">
        <QuizNameCard quizId={quizId} />
        <section
          className="flex flex-col gap-2 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-5 xs:p-7 rounded-2xl">
          <h1 className="text-xl xs:text-2xl font-semibold">
            Quiz Room Players
          </h1>
          <div className="flex flex-row gap-2 p-2 h-16 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
            <AudioDeviceManager selectedAudioDevice={selectedAudioDevice} setSelectedAudioDevice={setSelectedAudioDevice} />
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
  )
    ;
}
