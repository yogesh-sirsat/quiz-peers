// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;
// Define a service using a base URL and expected endpoints
export const roomsApi = createApi({
  reducerPath: "roomsApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getPublicRoomId: builder.query({
      query: () => `${BASE_URL}/rooms/get-public-room-id`,
    }),
    getPrivateRoomId: builder.query({
      query: () => `${BASE_URL}/rooms/get-private-room-id`,
    }),
    getRoomDetailsById: builder.query({
      query: (roomId) => `${BASE_URL}/rooms/${roomId}`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useLazyGetPublicRoomIdQuery,
  useGetPrivateRoomIdQuery,
  useGetRoomDetailsByIdQuery,
} = roomsApi;
