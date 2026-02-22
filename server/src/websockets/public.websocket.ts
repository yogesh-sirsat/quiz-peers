import { publicPlayingRooms, publicWaitingRooms } from "../websockets/rooms.websocket";
import { ExtendedWebSocket } from "../interfaces/websocket.interface";

export function handleJoinPublicRoom(ws: ExtendedWebSocket, data: any): void {
  console.log(publicPlayingRooms, publicWaitingRooms);
  if (publicPlayingRooms.has(data?.roomId)) {
    ws.send(
      JSON.stringify({
        event: "joinPublicRoomFailed",
        message: "Oops! Room already started playing Quiz!"
      })
    );
  } else if (publicWaitingRooms.has(data?.roomId)) {
    const room = publicWaitingRooms.get(data.roomId);
    if (room && data?.peerId) {
      room.set(data.peerId, {
        ws,
        playerName: data?.playerName || "Anonymous",
        readyToStart: false,
        score: 0
      });
      ws.send(
        JSON.stringify({
          event: "publicRoomJoined",
          roomDetails: Array.from(room.entries())
        })
      );
    }
  } else {
    ws.send(
      JSON.stringify({
        event: "joinPublicRoomFailed",
        message: "Oops! Room not found!"
      })
    );
  }
}

