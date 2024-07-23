import { generateRandomRoomId } from "../utils/rooms.utils.js";
import { getGeneratePlayerName } from "./players.websocket.js";
import HttpError from "../errors/app.error.js";

export const publicWaitingRooms = new Map();
export const publicPlayingRooms = new Map();
export const privateWaitingRooms = new Map();
export const privatePlayingRooms = new Map();

export function handleLeaveWaitingRoom(ws, data) {
  try {
    if (data?.isRoomPublic) {
      publicWaitingRooms.get(data?.roomId).delete(data?.playerName);
    } else {
      privateWaitingRooms.get(data?.roomId).delete(data?.playerName);
    }
  } catch (error) {
    console.error(error);
  }
}

export function handleJoinRoom(ws, data) {
  try {
    ws.peerId = data?.peerId;
    ws.playerName = data?.playerName;
    ws.roomId = data?.roomId;
    ws.isRoomPublic = data?.isRoomPublic;

    const room = data?.isRoomPublic
      ? publicWaitingRooms.get(data?.roomId)
      : privateWaitingRooms.get(data?.roomId);
    if (!room) {
      throw new Error("Oops, Room not found!");
    }
    const playerName = getGeneratePlayerName(room);
    room.set(data?.peerId, { peerId: data?.peerId, playerName, ws });
    ws.send(
      JSON.stringify({
        event: "joinRoomSuccess",
        playerName,
        roomPlayers: [...room.values()]
      })
    );
  } catch (error) {
    console.error(error);
    ws.send(
      JSON.stringify({ event: "joinRoomFailed", message: error.message })
    );
  }
}

export function getRoomDetails(roomId) {
  if (publicWaitingRooms.has(roomId)) {
    return publicWaitingRooms.get(roomId);
  }
  if (publicPlayingRooms.has(roomId)) {
    return publicPlayingRooms.get(roomId);
  }
  if (privateWaitingRooms.has(roomId)) {
    return privateWaitingRooms.get(roomId);
  }
  if (privatePlayingRooms.has(roomId)) {
    return privatePlayingRooms.get(roomId);
  }
  throw new HttpError("Room not found", 404);
}

export function isRoomIdInUse(roomId) {
  return (
    publicWaitingRooms.has(roomId) ||
    privateWaitingRooms.has(roomId) ||
    publicPlayingRooms.has(roomId) ||
    privatePlayingRooms.has(roomId)
  );
}

export function getValidGeneratedRoomId(isPublic = true) {
  // Try 1 Million times to find a room id that is not in use.
  let tries = 0;
  const million = 1000000;
  while (tries < million) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      if (isPublic) {
        publicWaitingRooms.set(roomId, new Map());
      } else {
        privateWaitingRooms.set(roomId, new Map());
      }
      return roomId;
    }
    tries += 1;
  }

  if (isPublic) {
    throw new HttpError("No room found to join, please try again!", 404);
  }
  throw new HttpError(
    "Could not create a private room, please try again!",
    404
  );
}

export function getValidPublicRoomId() {
  for (const [key, value] of publicWaitingRooms) {
    if (value.size < 10) {
      return key;
    }
  }
  return getValidGeneratedRoomId();
}
