// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;
// Define a service using a base URL and expected endpoints
export const quizzesApi = createApi({
  reducerPath: "quizzesApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Quiz", "Question", "Option"],
  endpoints: (builder) => ({
    getAllQuizzes: builder.query({
      query: (params = {}) => {
        const { onlyValid = true, includeTesting = false } = params;
        return `/quizzes?onlyValid=${onlyValid}&includeTesting=${includeTesting}`;
      },
      providesTags: ["Quiz"],
    }),
    getQuizById: builder.query({
      query: (quizId) => `/quizzes/${quizId}`,
      providesTags: (result, error, id) => [{ type: "Quiz", id }],
    }),
    createQuiz: builder.mutation({
      query: (body) => ({
        url: "/quizzes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quiz"],
    }),
    updateQuiz: builder.mutation({
      query: ({ quizId, ...body }) => ({
        url: `/quizzes/${quizId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }, "Quiz"],
    }),
    deleteQuiz: builder.mutation({
      query: ({ quizId, deleteQuestions }) => ({
        url: `/quizzes/${quizId}?deleteQuestions=${deleteQuestions}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quiz"],
    }),
    getQuizQuestions: builder.query({
      query: (quizId) => `/quizzes/${quizId}/get-questions`,
      providesTags: (result, error, quizId) => [{ type: "Question", id: `Quiz-${quizId}` }],
    }),
    getAllCategories: builder.query({
      query: () => "/quizzes/categories/all",
    }),

    // Questions
    getAllQuestions: builder.query({
      query: () => "/questions",
      providesTags: ["Question"],
    }),
    getQuestionById: builder.query({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: "Question", id }],
    }),
    createQuestion: builder.mutation({
      query: (body) => ({
        url: "/questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Question", "Quiz"],
    }),
    updateQuestion: builder.mutation({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Question", id: questionId }, "Question", "Quiz"],
    }),
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: `/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Question", "Quiz"],
    }),

    // Options
    getOptionsByQuestionId: builder.query({
      query: (questionId) => `/questions/${questionId}/options`,
      providesTags: (result, error, questionId) => [{ type: "Option", id: `Q-${questionId}` }],
    }),
    createOption: builder.mutation({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}/options`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Option", id: `Q-${questionId}` }, "Quiz"],
    }),
    updateOption: builder.mutation({
      query: ({ optionId, ...body }) => ({
        url: `/options/${optionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { optionId }) => ["Option", "Quiz"],
    }),
    deleteOption: builder.mutation({
      query: (optionId) => ({
        url: `/options/${optionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Option", "Quiz"],
    }),
    setCorrectOption: builder.mutation({
      query: ({ questionId, optionId }) => ({
        url: `/questions/${questionId}/correct-option`,
        method: "PUT",
        body: { optionId },
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Question", id: questionId }, "Quiz"],
    }),
    removeQuestionFromQuiz: builder.mutation({
      query: ({ quizId, questionId }) => ({
        url: `/quizzes/${quizId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Question", id: `Quiz-${quizId}` }, "Quiz"],
    }),
    uploadMedia: builder.mutation({
      query: (formData) => {
        const folder = formData.get("folder") || "misc";
        return {
          url: `/media/upload?folder=${folder}`,
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllQuizzesQuery,
  useGetQuizByIdQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetQuizQuestionsQuery,
  useGetAllCategoriesQuery,
  useGetAllQuestionsQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetOptionsByQuestionIdQuery,
  useCreateOptionMutation,
  useUpdateOptionMutation,
  useDeleteOptionMutation,
  useSetCorrectOptionMutation,
  useRemoveQuestionFromQuizMutation,
  useUploadMediaMutation,
} = quizzesApi;
