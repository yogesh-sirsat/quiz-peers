import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from "@nextui-org/react";
import { MessageSquareText, SendHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TextMessageCard from "./TextMessageCard.jsx";
import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { addChatMessage } from "../../store/features/roomSlice.js";

export default function TextChatInterface({ localPeerId, localPlayerName }) {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const chatMessages = useSelector((state) => state.room.chatMessages);
  const roomPlayers = useSelector((state) => state.room.roomPlayers);
  const [currentText, setCurrentText] = useState("");

  const handleSendMessage = (text) => {
    try {
      console.log("sending text to data connection", text);

      dispatch(addChatMessage({
        sender: localPlayerName,
        peerId: localPeerId,
        text: text,
        isPlayer: true,
        timeStamp: Date.now()
      }));
      console.log("sending text to data connection", text);

      Object.entries(roomPlayers).forEach(([key, value]) => {
        console.log(key)
        console.log(value)
        if (value?.dataConnection && value?.dataConnection?.open) {
          console.log("sending text to data connection", text);
          value?.dataConnection?.send({
            type: "chatMessage",
            sender: localPlayerName,
            peerId: key,
            text,
            isPlayer: true,
            timeStamp: Date.now()
          });
        } else {
          console.log("Not connected to data connection");
        }
      });
      setCurrentText("");
    } catch (error) {
      console.log(error);
    }
  };
  const sendButtonDisabled = useMemo(() => {
    if (!currentText) {
      return true;
    }
    return currentText.trim().length === 0;
  }, [currentText]);

  return (
    <>
      <Button isIconOnly variant={"flat"} radius={"sm"} onClick={onOpen}>
        <MessageSquareText />
      </Button>
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
        <ModalContent className="text-foreground bg-[#AF99B8]">
          <ModalHeader className="flex flex-col text-2xl xs:text-3xl gap-1">
            Text Chat
          </ModalHeader>
          <ModalBody className="pt-4 pb-6 xs:py-5">
            <ul className="flex flex-col gap-2">
              {chatMessages.map((message, id) => (
                <li key={id}>
                  <TextMessageCard message={message} />
                </li>
              ))}
            </ul>
          </ModalBody>
          <ModalFooter>
            <Input placeholder="Enter your message" onValueChange={setCurrentText} value={currentText} />
            <Button isIconOnly variant={"flat"} isDisabled={sendButtonDisabled} onClick={() => {
              handleSendMessage(currentText);
            }}>
              <SendHorizontal size={22} />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

TextChatInterface.propTypes = {
  localPeerId: PropTypes.string,
  localPlayerName: PropTypes.string
};