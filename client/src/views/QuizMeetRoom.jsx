import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Modal, useDisclosure } from "@nextui-org/react";
import NavbarComponent from "../components/ui/Navbar";
import { useCallback, useEffect, useRef, useState } from "react";
import QuizNameCard from "../components/quiz-meet-room/QuizNameCard";
import PlayerNameModal from "../components/quiz-meet-room/PlayerNameModal";
import { Mic, MicOff } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { MEDIA_CONSTRAINTS } from "../config/mediaConfig.js";
import AudioDeviceManager from "../components/quiz-meet-room/AudioDeviceManager.jsx";
import { useDispatch, useSelector } from "react-redux";
import { addChatMessage, addUpdateRoomPlayer, removeRoomPlayer } from "../store/features/roomSlice.js";
import TextChatInterface from "../components/quiz-meet-room/TextChatInterface.jsx";

export default function QuizMeetRoom() {
  const dispatch = useDispatch();
  const [connectionsInitiated, setConnectionsInitiated] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const webSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
  const navigate = useNavigate();
  const { quizId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [isRoomPublic, setIsRoomPublic] = useState(searchParams.get("public") === "true");
  const [roomError, setRoomError] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [localPeerId, setLocalPeerId] = useState();
  const [isLocalPlayerMute, setIsLocalPlayerMute] = useState(false);
  const peerRef = useRef(null);
  const roomPlayers = useSelector((state) => state.room.roomPlayers);

  const localStreamRef = useRef(new MediaStream());
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
    let currentLocalStream;
    const constraints = MEDIA_CONSTRAINTS;
    if (selectedAudioDevice) {
      constraints.audio.deviceId = selectedAudioDevice;
    }
    (async () => {
      try {
        currentLocalStream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current.srcObject = currentLocalStream;
        localStreamRef.current.muted = true;  // So we don't hear back ourselves
        localStreamRef.current.onloadedmetadata = () => {
          localStreamRef.current.play();
        };
      } catch (e) {
        alert(e.message);
        console.error(e);
      }
    })();
    return () => {
      // Stop the current local stream if it exists
      if (currentLocalStream) {
        currentLocalStream?.getTracks().forEach(track => track.stop());
      }
      localStreamRef.current = new MediaStream();
    };
  }, [selectedAudioDevice]);

  const handleConnectionData = useCallback((data) => {
    console.log(data);
    switch (data.type) {
      case "chatMessage":
        dispatch(addChatMessage({
          sender: data?.sender,
          isPlayer: true,
          text: data?.text,
          timeStamp: data?.timeStamp
        }));
        break;
      case "muteStatus":
        dispatch(addUpdateRoomPlayer({
          key: data?.peerId, value: { isMute: data?.muteStatus }
        }));
        break;
      default:
        break;
    }
  }, [dispatch]);

  const handlePlayerDataConnection = useCallback((player, localPlayerName) => {
    // Check if the data connection already exists before creating a new one
    let dataConnection = peerRef.current.connections[player?.peerId]?.find((conn) => conn.type === "data");
    if (!dataConnection) {
      console.log("Creating data connection");
      dataConnection = peerRef.current.connect(player?.peerId, {
        reliable: true,
        metadata: { playerName: localPlayerName }
      });
    }
    console.log("after dataconnection creation");
    dataConnection.on("open", () => {
      dataConnection.send("hello!");
      console.log("Data connection is opened -> ");
      console.log(dataConnection);
      dispatch(addUpdateRoomPlayer({
        key: player?.peerId, value: {
          dataConnection, playerName: player?.playerName, isMute: false
        }
      }));
      console.log("after adding to room player");
      dataConnection.on("data", (data) => {
        handleConnectionData(data);
      });
      dataConnection.on("close", () => {
        console.log(`${player?.playerName}'s data connection got closed! PeerId: ${player?.peerId}`);
      });
      dataConnection.on("error", () => {
        console.log(`${player?.playerName}'s data connection error! PeerId: ${player?.peerId}`);
      });
    });
  }, [dispatch, handleConnectionData]);

  const handleJoinRoomSuccess = useCallback((roomData, localPeerId, localPlayerName) => {
    try {
      console.log(roomData);
      roomData?.roomPlayers?.forEach((player) => {
        if (player?.peerId === localPeerId) {  // Avoid calling to self
          return;
        }
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", player);
        handlePlayerDataConnection(player, localPlayerName);

        // Check if the media connection already exists before creating a new one
        // let mediaConnection = peerRef.current.connections[player?.peerId]?.find((conn) => conn.type === "media");
        // if (!mediaConnection) {
        //   mediaConnection = peerRef.current.call(player?.peerId, localStreamRef.current.srcObject);
        // }
        // mediaConnection?.on("stream", (stream) => {
        //   console.log("Media connection is opened -> ", stream);
        //   dispatch(addUpdateRoomPlayer({
        //     key: player?.peerId, value: {
        //       dataConnection, stream, playerName: player?.playerName, isMute: false
        //     }
        //   }));
        // });
        // mediaConnection?.on("close", () => {
        //   console.log(`${player?.playerName}'s media connection got closed! PeerId: ${player?.peerId}`);
        // });
        // mediaConnection?.on("error", () => {
        //   console.log(`${player?.playerName}'s media connection error! PeerId: ${player?.peerId}`);
        // });
      });
    } catch (e) {
      console.error(e);
    }
  }, [handlePlayerDataConnection]);

  // WebSocket connection setup
  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocket(webSocketUrl);
    }
    let peerId;
    if (!peerRef.current) {
      peerId = uuidv4();
      peerRef.current = new Peer(peerId, {
        secure: false, debug: 3, config: {
          iceServers: [  // More stun/turn servers slows down connection discovery
            { urls: "stun:stun.l.google.com:19302" }, // {
            //   urls: "stun:stun.relay.metered.ca:80",
            // },
            {
              urls: "turn:freeturn.net:3478",  // UDP/TCP
              username: "free", credential: "free"
            }, {
              urls: "turns:freeturn.net:5349",  // TLS
              username: "free", credential: "free"
            }]
        }
      });
    } else {
      peerId = peerRef.current?.id;
    }

    // You should not wait for this event before connecting to other peers if connection speed is important.
    peerRef.current.on("open", (id) => {
      setLocalPeerId(id);
      console.log("Connected to peer");
      console.log(id);
    });

    peerRef.current.on("connection", (conn) => {
      setTimeout(() => {
        console.log("connection recieved from: ", conn?.peer);
        console.log(conn.metadata);
        dispatch(addUpdateRoomPlayer({
          key: conn.peer,
          value: { dataConnection: conn, playerName: conn?.metadata?.playerName, isMute: false }
        }));
        dispatch(addChatMessage({
          sender: "System",
          isPlayer: false,
          text: `${conn?.metadata?.playerName} joined the room!`,
          timeStamp: Date.now()
        }));
        conn.on("data", (data) => {
          handleConnectionData(data);
        });

        conn.on("close", () => {
          console.log(`${conn?.metadata?.playerName}'s data connection got closed! PeerId: ${conn?.peer}`);
        });

        conn.on("error", (error) => {
          console.log(`${conn?.metadata?.playerName}'s data connection error! PeerId: ${conn?.peer}`, error);
        });
      }, 1000);  // Delay because peerjs takes a while to open the connection
    });

    peerRef.current.on("call", (call) => {
      console.log("call recieved from: ", call?.peer);
      call.answer(localStreamRef.current.srcObject);
      call.on("stream", (remoteStream) => {
        dispatch(addUpdateRoomPlayer({
          key: call.peer,
          value: { stream: remoteStream, playerName: call?.metadata?.playerName, isMute: false }
        }));
      });

      call.on("close", () => {
        console.log(`${call?.metadata?.playerName}'s media connection got closed! PeerId: ${call?.peer}`);
      });

      call.on("error", (error) => {
        console.log(`${call?.metadata?.playerName}'s media connection error! PeerId: ${call?.peer}`, error);
      });
    });

    peerRef.current.on("close", async () => {
      await wsRef.current?.close();
      alert("Connection got closed");
      console.log("PeerJS connection closed");
      // navigate("/quiz/" + quizId);
    });

    peerRef.current.on("disconnected", () => {
      peerRef.current.reconnect();
    });

    wsRef.current.onopen = () => {
      try {
        console.log("Connected to web socket");
        wsRef.current.send(JSON.stringify({
          roomId, quizId, peerId, event: "joinRoom", isRoomPublic
        }));
      } catch (e) {
        console.log(e);
      }
    };

    wsRef.current.onmessage = (event) => {
      console.log(event);
      const data = JSON.parse(event.data);
      console.log(data);
      switch (data?.event) {
        case "roomError":
          setRoomError(data?.message);
          break;
        case "joinRoomSuccess":
          setPlayerName(data?.playerName);
          setTimeout(() => {
            handleJoinRoomSuccess(data, peerId, data?.playerName);
          }, 1000);  // Delay because peerjs takes a while to open the connection
          break;
        case "joinRoomFailed":
          alert(data?.message);
          navigate("/quiz/" + quizId);
          break;
        case "playerLeftWaitingRoom":
          dispatch(removeRoomPlayer(data?.peerId));
          dispatch(addChatMessage({
            sender: "System Bot",
            isPlayer: false,
            text: `${data?.playerName} left the room.`,
            timeStamp: Date.now()
          }));
          break;
        default:
          break;
      }
    };

    wsRef.current.onclose = () => {
      alert("Connection closed");
      console.log("WS connection closed");
      // navigate("/quiz/" + quizId);
    };

    wsRef.current.onerror = (error) => {
      console.log(error);
      // navigate("/quiz/" + quizId);
    };
    return () => {
      if (wsRef?.current) {
        wsRef.current.close();
      }
      if (peerRef?.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (roomError) {
      alert(roomError);
    }
  }, [roomError]);

  return (<section className="w-screen min-h-screen max-h-screen flex flex-col overflow-y-auto">
    <NavbarComponent />
    <article
      className="mt-4 xs:mt-6 mx-3 xs:mx-4 md:mx-auto w-auto md:w-[42rem] slg:w-[46rem] lg:w-[52rem] gap-2 flex flex-col overflow-y-auto">
      <QuizNameCard quizId={quizId} />
      <section
        className="mb-6 flex flex-col gap-2 text-foreground bg-background/60 shadow-2xl p-3 xxs:p-4 xs:p-6 rounded-2xl overflow-y-auto">
        <div className="flex flex-row justify-between items-center mb-2 pr-1">
          <h1 className="text-xl xs:text-2xl font-semibold">
            Quiz Room Players
          </h1>
          <TextChatInterface localPeerId={localPeerId} localPlayerName={playerName} />
        </div>

        <ul className={"flex flex-col gap-2 pr-1 rounded-2xl overflow-y-auto"}>
          <li
            className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
            <AudioDeviceManager {...{
              selectedAudioDevice,
              setSelectedAudioDevice,
              isLocalPlayerMute,
              setIsLocalPlayerMute
            }}
            />
            {/*<video ref={localStreamRef} autoPlay muted={isLocalPlayerMute} />*/}
            <h2 className={"flex-1 text-center"}>{playerName}(You)</h2>

          </li>
          {Object.entries(roomPlayers).map(([key, value], ind) => {
            return (<li key={ind}
                        className="flex flex-row min-w-full gap-2 p-2 h-12 items-center bg-[#39004E] text-background shadow-lg rounded-xl">
              <Button variant={"flat"} size={"sm"} isIconOnly>
                {value?.isMute ? (
                  <MicOff size={22} />
                ) : (
                  <Mic size={22} />
                )}
              </Button>
              {/*<audio src={value?.stream} autoPlay muted={value?.isMute} />*/}
              <h2 className={"flex-1 text-center"}>{value?.playerName}</h2>
            </li>);
          })}
        </ul>
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
  </section>);
}
