import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chatMessages: [],
  roomPlayers: {}
  // isLocalPlayer
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    addUpdateRoomPlayer: (state, action) => {
      const { key, value } = action.payload;
      state.roomPlayers[key] = { ...state.roomPlayers[key], ...value }; // Update if key exists
    },
    removeRoomPlayer: (state, action) => {
      const key = action.payload;
      delete state.roomPlayers[key];
    },
    muteRoomPlayer: (state, action) => {
      const peerId = action.payload;
      state.roomPlayers = { ...state.roomPlayers[peerId], isMute: true };
    },
    unmuteRoomPlayer: (state, action) => {
      const peerId = action.payload;
      state.roomPlayers = { ...state.roomPlayers[peerId], isMute: false };
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