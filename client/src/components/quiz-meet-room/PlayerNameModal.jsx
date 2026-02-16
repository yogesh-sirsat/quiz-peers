import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { generateClientSidePlayerName } from "../../utils/playerUtils.js";

export default function PlayerNameModal({ isOpen, onOpenChange, currentName, onSave }) {
  const [name, setName] = useState(currentName || "");

  useEffect(() => {
    if (isOpen) {
      setName(currentName || "");
    }
  }, [isOpen, currentName]);

  const handleLocalRegenerate = () => {
    setName(generateClientSidePlayerName());
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent className="text-foreground bg-[#AF99B8]">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-2xl">Edit Player Name</ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                label="Name"
                placeholder="Enter your name"
                variant="bordered"
                value={name}
                onValueChange={setName}
                maxLength={50}
              />
            </ModalBody>
            <ModalFooter className="flex justify-between">
               <Button 
                color="secondary" 
                variant="flat" 
                startContent={<RefreshCw size={18} />}
                onClick={handleLocalRegenerate}
              >
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => {
                  onSave(name);
                  onClose();
                }}>
                  Save
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
