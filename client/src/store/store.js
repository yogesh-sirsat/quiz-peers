import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { quizzesApi } from "../store/api/quizzesApi";
import { roomsApi } from "../store/api/roomsApi";

export const store = configureStore({
  reducer: {
    [quizzesApi.reducerPath]: quizzesApi.reducer,
    [roomsApi.reducerPath]: roomsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(quizzesApi.middleware, roomsApi.middleware),
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);
