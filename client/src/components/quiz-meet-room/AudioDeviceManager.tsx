import { Button, ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { ChevronDown, Mic, MicOff } from "lucide-react";
import { useEffect, useState, Key } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

interface AudioDeviceManagerProps {
  selectedAudioDevice: string | null;
  setSelectedAudioDevice: (deviceId: string) => void;
  isLocalPlayerMute: boolean;
  setIsLocalPlayerMute: (mute: boolean) => void;
  isSpeaking: boolean;
}

export default function AudioDeviceManager({
  selectedAudioDevice,
  setSelectedAudioDevice,
  isLocalPlayerMute,
  setIsLocalPlayerMute,
  isSpeaking
}: AudioDeviceManagerProps) {
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevicesList = devices.filter((device) => device.kind === "audioinput");
        setAudioDevices(audioDevicesList);
        const defaultAudio = audioDevicesList.find((device) => device.label);
        if (defaultAudio && !selectedAudioDevice) {
          setSelectedAudioDevice(defaultAudio.deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    })();
  }, [selectedAudioDevice, setSelectedAudioDevice]);

  const handleAudioChange = (key: Key) => {
    setSelectedAudioDevice(String(key));
  };

  const handleLocalPlayerMuteStatus = (muteStatus: boolean) => {
    setIsLocalPlayerMute(muteStatus);
    Object.values(roomPlayers).forEach((player: any) => {
      if (player?.dataConnection?.open) {
        player.dataConnection.send({
          type: "muteStatus",
          muteStatus,
          peerId: player.peerId
        });
      }
    });
  };

  return (
    <ButtonGroup variant={"flat"} size={"sm"}>
      <Button
        onClick={() => {
          handleLocalPlayerMuteStatus(!isLocalPlayerMute);
        }}
        isIconOnly
        className={isSpeaking && !isLocalPlayerMute ? "border-2 border-green-500" : ""}
      >
        {isLocalPlayerMute ? (
          <MicOff size={22} />
        ) : (
          <Mic size={22} />
        )}
      </Button>
      <Dropdown 
        placement="bottom" 
        classNames={{
          content: "bg-[#39004E] border border-background/60 "
        }} 
        size={"sm"}
      >
        <DropdownTrigger>
          <Button isIconOnly>
            <ChevronDown size={22} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Audio device options"
          selectedKeys={selectedAudioDevice ? [selectedAudioDevice] : []}
          selectionMode="single"
          onAction={handleAudioChange}
          className="max-w-[300px]"
          itemClasses={{
            base: [
              "transition-opacity",
              "data-[hover=true]:bg-background/60",
              "data-[selectable=true]:focus:bg-background/60",
              "data-[pressed=true]:opacity-70"
            ]
          }}
        >
          {(audioDevices || [])?.map((device, index) => (
            <DropdownItem key={device.deviceId}>
              {device.label || `Audio Device ${index + 1}`}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </ButtonGroup>
  );
}
