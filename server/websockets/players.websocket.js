import { publicWaitingRooms, privateWaitingRooms } from "./rooms.websocket.js";
import { generateRandomPlayerName } from "../utils/players.utils.js";
import { nanoid } from "nanoid";

export function handleGeneratePlayerName(ws, data) {
  const room = data?.isRoomPublic ? publicWaitingRooms.get(data?.roomId) : privateWaitingRooms.get(data?.roomId);
  if (!room) {
    ws.send(
      JSON.stringify({
        event: "generatePlayerNameFailed",
        message: "Oops! Room not found!"
      })
    );
    return;
  }
  let tries = 0;
  const fiftyThousand = 50000;
  while (tries < fiftyThousand) {
    const playerName = generateRandomPlayerName();
    if (!room.has(playerName)) {
      room.add(playerName);
      ws.send(
        JSON.stringify({
          event: "playerNameGenerated",
          playerName
        })
      );
      return;
    }
  }

  ws.send(
    JSON.stringify({
      event: "playerNameGenerated",
      playerName: nanoid()
    })
  );
}

export function handleChangePlayerName(ws, data) {
  const room = data?.isRoomPublic ? publicWaitingRooms.get(data?.roomId) : privateWaitingRooms.get(data?.roomId);
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
