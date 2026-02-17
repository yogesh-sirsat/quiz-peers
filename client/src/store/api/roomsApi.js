// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;
// Define a service using a base URL and expected endpoints
export const roomsApi = createApi({
  reducerPath: "roomsApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getPublicRoomId: builder.query({
      query: (quizId) => `/rooms/get-public-room-id?quizId=${quizId}`,
    }),
    getIdForPrivateRoom: builder.query({
      query: (quizId) => `/rooms/get-id-for-private-room?quizId=${quizId}`,
    }),
    getRoomDetailsById: builder.query({
      query: (roomId) => `/rooms/${roomId}`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetPublicRoomIdQuery,
  useLazyGetIdForPrivateRoomQuery,
  useGetRoomDetailsByIdQuery,
} = roomsApi;
