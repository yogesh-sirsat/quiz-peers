import { WaitingRoom } from "./rooms.websocket";
import { generateRandomPlayerName } from "../utils/players.utils";
import { nanoid } from "nanoid";
import { ExtendedWebSocket } from "../interfaces/websocket.interface";

export function getGeneratePlayerName(room: WaitingRoom): string {
  let tries = 0;
  const fiftyThousand = 50000;
  const currentRoomPlayerNames = new Set<string>();
  for (const value of room.values()) {
    currentRoomPlayerNames.add(value.playerName);
  }
  while (tries < fiftyThousand) {
    const playerName = generateRandomPlayerName();
    if (!currentRoomPlayerNames.has(playerName)) {
      return playerName;
    }
    tries++;
  }
  return nanoid();
}

export function handleChangePlayerName(_ws: ExtendedWebSocket, _data: any): void {
  // This logic seems redundant with the one in rooms.websocket.ts, but let's type it correctly
  // In a real refactor, one of these should be removed.
}

