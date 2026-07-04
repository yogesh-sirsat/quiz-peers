import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react";
import { ChatMessage } from "../../types";

interface TextMessageCardProps {
  message: ChatMessage;
  showName?: boolean;
}

export default function TextMessageCard({ message, showName = true }: TextMessageCardProps) {
  const timeString = new Date(message?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <Card 
      className={`min-w-48 max-w-full w-full ${!showName ? "rounded-tl-sm rounded-tr-sm" : ""} bg-background/60`} 
      shadow="sm"
      isBlurred
    >
      {showName && (
        <CardHeader className="flex pb-0 gap-2 items-center">
          <div className="min-w-6 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary uppercase">
            {message?.sender?.charAt(0) || "?"}
          </div>
          <p className="text-sm font-semibold text-foreground/90">{message?.sender}</p>
        </CardHeader>
      )}
      <CardBody className={`py-1 px-3 ${showName ? "" : "pt-2"}`}>
        <p className="text-sm break-words text-foreground/80">{message?.text}</p>
      </CardBody>
      <CardFooter className="pt-0 justify-end pb-1 pr-2">
        <p className="text-[10px] text-default-400">
          {timeString}
        </p>
      </CardFooter>
    </Card>
  );
}
