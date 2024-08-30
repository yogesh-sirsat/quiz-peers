import { Button, ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { ChevronDown, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function AudioDeviceManager({ selectedAudioDevice, setSelectedAudioDevice }) {
  const [audioDevices, setAudioDevices] = useState(null);

  useEffect(() => {
    // Fetch and enumerate audio devices when the component mounts
    (async () => {
      await navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioDevicesList = devices.filter((device) => device.kind === "audioinput");

        setAudioDevices(audioDevicesList);

        // Find the default audio devices
        const defaultAudio = audioDevicesList.find((device) => device.label);

        // Set default selected values
        setSelectedAudioDevice(defaultAudio ? defaultAudio.deviceId : null);
      });
    })();
  }, []); // eslint-disable-line

  const handleAudioChange = (value) => {
    setSelectedAudioDevice(value);
  };

  return (<ButtonGroup variant={"flat"} size={"sm"}>
    <Button
      // onClick={() => {
      //   onOpenChange(true);
      // }}
      isIconOnly
    >
      <Mic size={22} />
    </Button>
    <Dropdown placement="bottom" classNames={{
      content: "bg-[#39004E] border border-background/60 "
    }} size={"sm"}>
      <DropdownTrigger>
        <Button
          isIconOnly
        >
          <ChevronDown size={22} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Audio device options"
        selectedKeys={selectedAudioDevice}
        selectionMode="single"
        onSelectionChange={handleAudioChange}
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
        {audioDevices?.map((device, index) => (
          <DropdownItem key={device.deviceId}>
            {device.label || `Audio Device ${index + 1}`}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  </ButtonGroup>);
}

AudioDeviceManager.propTypes = {
  selectedAudioDevice: PropTypes.string,
  setSelectedAudioDevice: PropTypes.func
};