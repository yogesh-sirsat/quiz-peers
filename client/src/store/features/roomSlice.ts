import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage, RoomPlayer } from "../../types";

interface RoomState {
  chatMessages: ChatMessage[];
  roomPlayers: Record<string, RoomPlayer>;
}

const initialState: RoomState = {
  chatMessages: [],
  roomPlayers: {}
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatMessages.push(action.payload);
    },
    addUpdateRoomPlayer: (state, action: PayloadAction<{ key: string; value: Partial<RoomPlayer> }>) => {
      const { key, value } = action.payload;
      state.roomPlayers[key] = { ...(state.roomPlayers[key] || { peerId: key }), ...value };
    },
    removeRoomPlayer: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.roomPlayers[key];
    },
    muteRoomPlayer: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      if (state.roomPlayers[peerId]) {
        state.roomPlayers[peerId].isMute = true;
      }
    },
    unmuteRoomPlayer: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      if (state.roomPlayers[peerId]) {
        state.roomPlayers[peerId].isMute = false;
      }
    }
  }
});

export const {
  addChatMessage,
  addUpdateRoomPlayer,
  removeRoomPlayer,
  muteRoomPlayer,
  unmuteRoomPlayer
} = roomSlice.actions;
export default roomSlice.reducer;
