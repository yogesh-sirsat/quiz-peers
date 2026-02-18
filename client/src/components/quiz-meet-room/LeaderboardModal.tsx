import React from "react";
import { useSelector } from "react-redux";
import { Modal, ModalBody, ModalContent, ModalHeader, Button } from "@nextui-org/react";
import { Mic, MicOff } from "lucide-react";
import { RootState } from "../../store/store";
import { LeaderboardEntry } from "../../types";

interface LeaderboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leaderboard: LeaderboardEntry[];
  toggleMute: (peerId: string, currentMuteStatus: boolean) => void;
}

export function LeaderboardModal({ isOpen, onOpenChange, leaderboard, toggleMute }: LeaderboardModalProps) {
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);

  return (
    <Modal
      size={"lg"}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      classNames={{
        closeButton: "hover:bg-background/30 active:bg-background/25"
      }}
    >
      <ModalContent className="text-foreground bg-[#AF99B8]">
        <ModalHeader className="text-2xl">Leaderboard</ModalHeader>
        <ModalBody className="pb-6">
          <ul className="flex flex-col gap-2">
            {leaderboard.length === 0 ? (
              <li className="text-sm opacity-80">No scores yet.</li>
            ) : (
              leaderboard.map((player, index) => {
                const roomPlayer = roomPlayers[player.peerId];
                const isMute = roomPlayer?.isMute || false;
                
                return (
                <li
                  key={player.peerId}
                  className="flex items-center justify-between rounded-xl px-3 py-2 bg-background/10 border border-background/20"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-medium">#{index + 1}</p>
                    {roomPlayer && (
                       <Button 
                         variant="light" 
                         size="sm" 
                         isIconOnly 
                         onClick={() => toggleMute(player.peerId, isMute)}
                         className={roomPlayer?.isSpeaking ? "border-2 border-green-500" : ""}
                       >
                         {isMute ? <MicOff size={16} /> : <Mic size={16} />}
                       </Button>
                    )}
                    <p className="font-medium">{player.playerName}</p>
                  </div>
                  <p className="font-semibold">{player.score} pts</p>
                </li>
              )})
            )}
          </ul>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
