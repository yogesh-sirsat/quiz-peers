import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Quiz, Question, Option, QuizParams } from "../../types";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;

export const quizzesApi = createApi({
  reducerPath: "quizzesApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["Quiz", "Question", "Option"],
  endpoints: (builder) => ({
    getAllQuizzes: builder.query<Quiz[], QuizParams | void>({
      query: (params = {}) => {
        const { onlyValid = true, includeTesting = false } = params || {};
        return `/quizzes?onlyValid=${onlyValid}&includeTesting=${includeTesting}`;
      },
      providesTags: ["Quiz"],
    }),
    getQuizById: builder.query<Quiz, string>({
      query: (quizId) => `/quizzes/${quizId}`,
      providesTags: (result, error, id) => [{ type: "Quiz", id }],
    }),
    createQuiz: builder.mutation<Quiz, Partial<Quiz>>({
      query: (body) => ({
        url: "/quizzes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quiz"],
    }),
    updateQuiz: builder.mutation<Quiz, { quizId: string } & Partial<Quiz>>({
      query: ({ quizId, ...body }) => ({
        url: `/quizzes/${quizId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Quiz", id: quizId }, "Quiz"],
    }),
    deleteQuiz: builder.mutation<void, { quizId: string; deleteQuestions: boolean }>({
      query: ({ quizId, deleteQuestions }) => ({
        url: `/quizzes/${quizId}?deleteQuestions=${deleteQuestions}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quiz"],
    }),
    getQuizQuestions: builder.query<Question[], string>({
      query: (quizId) => `/quizzes/${quizId}/get-questions`,
      providesTags: (result, error, quizId) => [{ type: "Question", id: `Quiz-${quizId}` }],
    }),
    getAllCategories: builder.query<string[], void>({
      query: () => "/quizzes/categories/all",
    }),

    // Questions
    getAllQuestions: builder.query<Question[], void>({
      query: () => "/questions",
      providesTags: ["Question"],
    }),
    getQuestionById: builder.query<Question, string>({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: "Question", id }],
    }),
    createQuestion: builder.mutation<Question, Partial<Question>>({
      query: (body) => ({
        url: "/questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Question", "Quiz"],
    }),
    updateQuestion: builder.mutation<Question, { questionId: string } & Partial<Question>>({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Question", id: questionId }, "Question", "Quiz"],
    }),
    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Question", "Quiz"],
    }),

    // Options
    getOptionsByQuestionId: builder.query<Option[], string>({
      query: (questionId) => `/questions/${questionId}/options`,
      providesTags: (result, error, questionId) => [{ type: "Option", id: `Q-${questionId}` }],
    }),
    createOption: builder.mutation<Option, { questionId: string } & Partial<Option>>({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}/options`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Option", id: `Q-${questionId}` }, "Quiz"],
    }),
    updateOption: builder.mutation<Option, { optionId: string } & Partial<Option>>({
      query: ({ optionId, ...body }) => ({
        url: `/options/${optionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { optionId }) => ["Option", "Quiz"],
    }),
    deleteOption: builder.mutation<void, string>({
      query: (optionId) => ({
        url: `/options/${optionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Option", "Quiz"],
    }),
    setCorrectOption: builder.mutation<void, { questionId: string; optionId: string }>({
      query: ({ questionId, optionId }) => ({
        url: `/questions/${questionId}/correct-option`,
        method: "PUT",
        body: { optionId },
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "Question", id: questionId }, "Quiz"],
    }),
    removeQuestionFromQuiz: builder.mutation<void, { quizId: string; questionId: string }>({
      query: ({ quizId, questionId }) => ({
        url: `/quizzes/${quizId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "Question", id: `Quiz-${quizId}` }, "Quiz"],
    }),
    uploadMedia: builder.mutation<{ url: string }, FormData>({
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
