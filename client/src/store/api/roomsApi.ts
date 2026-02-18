import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RoomDetails } from "../../types";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;

export const roomsApi = createApi({
  reducerPath: "roomsApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getPublicRoomId: builder.query<string, number>({
      query: (quizId) => `/rooms/get-public-room-id?quizId=${quizId}`,
    }),
    getIdForPrivateRoom: builder.query<string, number>({
      query: (quizId) => `/rooms/get-id-for-private-room?quizId=${quizId}`,
    }),
    getRoomDetailsById: builder.query<RoomDetails, string>({
      query: (roomId) => `/rooms/${roomId}`,
    }),
  }),
});

export const {
  useLazyGetPublicRoomIdQuery,
  useLazyGetIdForPrivateRoomQuery,
  useGetRoomDetailsByIdQuery,
} = roomsApi;
