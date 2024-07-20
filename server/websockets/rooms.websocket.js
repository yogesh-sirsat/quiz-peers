import { generateRandomRoomId } from "../utils/rooms.utils.js";
import HttpError from "../errors/app.error.js";

export const publicWaitingRooms = new Map();
export const publicPlayingRooms = new Map();
export const privateWaitingRooms = new Map();
export const privatePlayingRooms = new Map();

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
  // Try 1000 times to find a room id that is not in use yet
  let tries = 0;
  while (tries < 1000) {
    const roomId = generateRandomRoomId();
    if (!isRoomIdInUse(roomId)) {
      if (isPublic) {
        publicWaitingRooms.set(roomId, new Set());
      } else {
        privateWaitingRooms.set(roomId, new Set());
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
