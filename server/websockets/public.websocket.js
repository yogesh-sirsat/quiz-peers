import { publicPlayingRooms, publicWaitingRooms } from "../websockets/rooms.websocket.js";

export function handleJoinPublicRoom(ws, data) {
  console.log(publicPlayingRooms, publicWaitingRooms);
  if (publicPlayingRooms.has(data?.roomId)) {
    ws.send(
      JSON.stringify({
        event: "joinPublicRoomFailed",
        message: "Oops! Room already started playing Quiz!"
      })
    );
  } else if (publicWaitingRooms.has(data?.roomId)) {
    publicWaitingRooms.get(data.roomId).add(data?.playerName);
    ws.send(
      JSON.stringify({
        event: "publicRoomJoined",
        roomDetails: publicWaitingRooms.get(data?.roomId)
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        event: "joinPublicRoomFailed",
        message: "Oops! Room not found!"
      })
    );
  }
}
