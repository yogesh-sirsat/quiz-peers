import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RoomDetails } from "../../types";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;

export interface RoomRequestParams {
  quizId?: number;
  mode?: "TRIVIA" | "SIMILARITY";
  similarityQuestionCount?: number;
}

function toRoomQuery(params: RoomRequestParams): string {
  const mode = params.mode || "TRIVIA";
  const query = new URLSearchParams();
  if (params.quizId !== undefined && params.quizId !== null) {
    query.set("quizId", String(params.quizId));
  }
  query.set("mode", mode);
  if (mode === "SIMILARITY") {
    query.set("similarityQuestionCount", String(Math.max(1, Math.min(20, params.similarityQuestionCount || 10))));
  }
  return query.toString();
}

export const roomsApi = createApi({
  reducerPath: "roomsApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getPublicRoomId: builder.query<string, RoomRequestParams>({
      query: (params) => `/rooms/get-public-room-id?${toRoomQuery(params || {})}`,
    }),
    getIdForPrivateRoom: builder.query<string, RoomRequestParams>({
      query: (params) => `/rooms/get-id-for-private-room?${toRoomQuery(params || {})}`,
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
