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
import { useState } from "react";
import { addChatMessage } from "../../store/features/roomSlice.js";

export default function TextChatInterface({ playerName }) {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const chatMessages = useSelector((state) => state.room.chatMessages);
  const [currentText, setCurrentText] = useState("");
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
            <Button isIconOnly variant={"flat"} onClick={() => {
              dispatch(addChatMessage({
                sender: playerName,
                isPlayer: true,
                text: currentText,
                timeStamp: Date.now()
              }));
              setCurrentText("");
            }}>
              <SendHorizontal size={22} />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}