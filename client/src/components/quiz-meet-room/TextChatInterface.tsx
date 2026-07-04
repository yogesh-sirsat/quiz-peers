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
import TextMessageCard from "./TextMessageCard";
import { useMemo, useState, KeyboardEvent } from "react";
import { addChatMessage } from "../../store/features/roomSlice";
import { RootState } from "../../store/store";
import { v4 as uuidv4 } from "uuid";

interface TextChatInterfaceProps {
  localPeerId: string;
  localPlayerName: string;
}

export default function TextChatInterface({ localPeerId, localPlayerName }: TextChatInterfaceProps) {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const chatMessages = useSelector((state: RootState) => state.room.chatMessages);
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);
  const [currentText, setCurrentText] = useState("");

  const handleSendMessage = (text: string) => {
    if (!text || !text.trim()) return;

    try {
      const messagePayload = {
        id: uuidv4(),
        sender: localPlayerName,
        peerId: localPeerId,
        text: text,
        isPlayer: true,
        timestamp: Date.now()
      };

      dispatch(addChatMessage(messagePayload));

      Object.values(roomPlayers).forEach((player: any) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !sendButtonDisabled) {
      handleSendMessage(currentText);
    }
  };

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
                  <li key={message.id || id} className={`flex flex-col ${showName ? "mt-2" : "mt-0.5"}`}>
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
                onKeyDown={handleKeyDown}
                className="flex-1"
                classNames={{
                  inputWrapper: "bg-black/10 hover:bg-black/20 focus-within:!bg-black/20",
                  input: "placeholder:text-foreground/50"
                }}
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
