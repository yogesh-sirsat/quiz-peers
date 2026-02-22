import { Button, ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { ChevronDown, Mic, MicOff } from "lucide-react";
import { useEffect, useState, Key } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

interface AudioDeviceManagerProps {
  localPeerId?: string;
  selectedAudioDevice: string | null;
  setSelectedAudioDevice: (deviceId: string) => void;
  isLocalPlayerMute: boolean;
  setIsLocalPlayerMute: (mute: boolean) => void;
  isSpeaking: boolean;
}

export default function AudioDeviceManager({
  localPeerId,
  selectedAudioDevice,
  setSelectedAudioDevice,
  isLocalPlayerMute,
  setIsLocalPlayerMute,
  isSpeaking
}: AudioDeviceManagerProps) {
  const roomPlayers = useSelector((state: RootState) => state.room.roomPlayers);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[] | null>(null);
  const speakingIndicatorClass = "ring-2 ring-green-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]";

  useEffect(() => {
    const updateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevicesList = devices.filter((device) => device.kind === "audioinput");
        setAudioDevices(audioDevicesList);
        
        // If we have devices and labels but haven't selected one yet, or if selected one is gone
        const defaultAudio = audioDevicesList.find((device) => device.label && device.deviceId);
        if (defaultAudio && (!selectedAudioDevice || !audioDevicesList.find(d => d.deviceId === selectedAudioDevice))) {
          setSelectedAudioDevice(defaultAudio.deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };

    updateDevices();
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
    };
  }, [selectedAudioDevice, setSelectedAudioDevice]);

  const handleAudioChange = (key: Key) => {
    setSelectedAudioDevice(String(key));
  };

  const handleLocalPlayerMuteStatus = (muteStatus: boolean) => {
    if (!localPeerId) return;
    setIsLocalPlayerMute(muteStatus);
    Object.values(roomPlayers).forEach((player: any) => {
      if (player?.dataConnection?.open) {
        player.dataConnection.send({
          type: "muteStatus",
          muteStatus,
          peerId: localPeerId
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
        className={`relative ${isSpeaking && !isLocalPlayerMute ? speakingIndicatorClass : ""}`}
      >
        {isLocalPlayerMute ? (
          <MicOff size={22} />
        ) : (
          <Mic size={22} />
        )}
        {isSpeaking && !isLocalPlayerMute && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
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
