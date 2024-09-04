import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { quizzesApi } from "./api/quizzesApi.js";
import { roomsApi } from "./api/roomsApi.js";
import roomReducer from "./features/roomSlice.js";

export const store = configureStore({
  reducer: {
    [quizzesApi.reducerPath]: quizzesApi.reducer,
    [roomsApi.reducerPath]: roomsApi.reducer,
    room: roomReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(quizzesApi.middleware, roomsApi.middleware)
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);
