// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;
// Define a service using a base URL and expected endpoints
export const quizzesApi = createApi({
  reducerPath: "quizzesApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getAllQuizzes: builder.query({
      query: () => `${BASE_URL}/quizzes/get-all-quizzes`,
    }),
    getQuizById: builder.query({
      query: (quizId) => `${BASE_URL}/quizzes/${quizId}`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetAllQuizzesQuery, useGetQuizByIdQuery } = quizzesApi;
