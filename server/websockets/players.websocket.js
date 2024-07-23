import { publicWaitingRooms, privateWaitingRooms } from "./rooms.websocket.js";
import { generateRandomPlayerName } from "../utils/players.utils.js";
import { nanoid } from "nanoid";

export function getGeneratePlayerName(room) {
  let tries = 0;
  const fiftyThousand = 50000;
  const currentRoomPlayerNames = new Set();
  for (const value of room.values()) {
    currentRoomPlayerNames.add(value.playerName);
  }
  while (tries < fiftyThousand) {
    const playerName = generateRandomPlayerName();
    if (!currentRoomPlayerNames.has(playerName)) {
      return playerName;
    }
  }
  return nanoid();
}

export function handleChangePlayerName(ws, data) {
  const room = data?.isRoomPublic
    ? publicWaitingRooms.get(data?.roomId)
    : privateWaitingRooms.get(data?.roomId);
  if (!room) {
    ws.send(
      JSON.stringify({
        event: "changePlayerNameFailed",
        message: "Oops! Room not found!"
      })
    );
    return;
  }
  if (!room.has(data?.playerName)) {
    ws.send(
      JSON.stringify({
        event: "changePlayerNameFailed",
        message: "Oops! Player not found!"
      })
    );
    return;
  }
  room.delete(data?.playerName);
  room.add(data?.newPlayerName);
  ws.send(
    JSON.stringify({
      event: "playerNameChanged",
      succss: true,
      newPlayerName: data?.newPlayerName
    })
  );
}
