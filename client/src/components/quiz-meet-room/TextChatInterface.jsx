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
    if (!text || !text.trim()) return;

    try {
      const messagePayload = {
        sender: localPlayerName,
        peerId: localPeerId,
        text: text,
        isPlayer: true,
        timeStamp: Date.now()
      };

      dispatch(addChatMessage(messagePayload));

      Object.values(roomPlayers).forEach((player) => {
        if (player?.dataConnection?.open) {
          player.dataConnection.send({
            type: "chatMessage",
            ...messagePayload
          });
        }
      });
      setCurrentText("");
    } catch (error) {
      console.error("Error sending message:", error);
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
      <Button isIconOnly variant={"flat"} size={"sm"} radius={"sm"} onClick={onOpen}>
        <MessageSquareText size={20} />
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
            <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto px-1">
              {chatMessages.map((message, id) => {
                const showName = id === 0 || chatMessages[id - 1].sender !== message.sender;
                return (
                  <li key={id} className={`flex flex-col ${showName ? "mt-2" : "mt-0.5"}`}>
                    <TextMessageCard message={message} showName={showName} />
                  </li>
                );
              })}
            </ul>
          </ModalBody>
          <ModalFooter>
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Type a message..." 
                value={currentText} 
                onValueChange={setCurrentText} 
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sendButtonDisabled) {
                    handleSendMessage(currentText);
                  }
                }}
                className="flex-1"
              />
              <Button isIconOnly color="primary" isDisabled={sendButtonDisabled} onClick={() => {
                handleSendMessage(currentText);
              }}>
                <SendHorizontal size={18} />
              </Button>
            </div>
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