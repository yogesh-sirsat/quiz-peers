import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { QuizDTO, QuestionDTO, OptionDTO, QuizParams, CategoryDTO, QuizQuestion } from "../../types";

const BASE_URL = import.meta.env.VITE_SERVER_API_URL;

export const quizzesApi = createApi({
  reducerPath: "quizzesApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ["QuizDTO", "QuestionDTO", "OptionDTO"],
  endpoints: (builder) => ({
    getAllQuizzes: builder.query<QuizDTO[], QuizParams>({
      query: (params = {}) => {
        const { onlyValid = true, includeTesting = false } = params || {};
        return `/quizzes?onlyValid=${onlyValid}&includeTesting=${includeTesting}`;
      },
      providesTags: ["QuizDTO"],
    }),
    getQuizById: builder.query<QuizDTO, number>({
      query: (quizId) => `/quizzes/${quizId}`,
      providesTags: (result, error, id) => [{ type: "QuizDTO", id }],
    }),
    createQuiz: builder.mutation<QuizDTO, Partial<QuizDTO>>({
      query: (body) => ({
        url: "/quizzes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuizDTO"],
    }),
    updateQuiz: builder.mutation<QuizDTO, { quizId: number } & Partial<QuizDTO>>({
      query: ({ quizId, ...body }) => ({
        url: `/quizzes/${quizId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "QuizDTO", id: quizId }, "QuizDTO"],
    }),
    deleteQuiz: builder.mutation<void, { quizId: number; deleteQuestions: boolean }>({
      query: ({ quizId, deleteQuestions }) => ({
        url: `/quizzes/${quizId}?deleteQuestions=${deleteQuestions}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuizDTO"],
    }),
    getQuizQuestions: builder.query<QuizQuestion[], number>({
      query: (quizId) => `/quizzes/${quizId}/get-questions`,
      providesTags: (result, error, quizId) => [{ type: "QuestionDTO", id: `Quiz-${quizId}` }],
    }),
    getAllCategories: builder.query<CategoryDTO[], void>({
      query: () => "/quizzes/categories/all",
    }),

    // Questions
    getAllQuestions: builder.query<QuestionDTO[], void>({
      query: () => "/questions",
      providesTags: ["QuestionDTO"],
    }),
    getQuestionById: builder.query<QuestionDTO, number>({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: "QuestionDTO", id }],
    }),
    createQuestion: builder.mutation<QuestionDTO, Partial<QuestionDTO>>({
      query: (body) => ({
        url: "/questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuestionDTO", "QuizDTO"],
    }),
    updateQuestion: builder.mutation<QuestionDTO, { questionId: number } & Partial<QuestionDTO>>({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "QuestionDTO", id: questionId }, "QuestionDTO", "QuizDTO"],
    }),
    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuestionDTO", "QuizDTO"],
    }),

    // Options
    getOptionsByQuestionId: builder.query<OptionDTO[], number>({
      query: (questionId) => `/questions/${questionId}/options`,
      providesTags: (result, error, questionId) => [{ type: "OptionDTO", id: `Q-${questionId}` }],
    }),
    createOption: builder.mutation<OptionDTO, { questionId: number } & Partial<OptionDTO>>({
      query: ({ questionId, ...body }) => ({
        url: `/questions/${questionId}/options`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "OptionDTO", id: `Q-${questionId}` }, "QuizDTO"],
    }),
    updateOption: builder.mutation<OptionDTO, { optionId: number } & Partial<OptionDTO>>({
      query: ({ optionId, ...body }) => ({
        url: `/options/${optionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { optionId }) => ["OptionDTO", "QuizDTO"],
    }),
    deleteOption: builder.mutation<void, number>({
      query: (optionId) => ({
        url: `/options/${optionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OptionDTO", "QuizDTO"],
    }),
    setCorrectOption: builder.mutation<void, { questionId: number; optionId: number }>({
      query: ({ questionId, optionId }) => ({
        url: `/questions/${questionId}/correct-option`,
        method: "PUT",
        body: { optionId },
      }),
      invalidatesTags: (result, error, { questionId }) => [{ type: "QuestionDTO", id: questionId }, "QuizDTO"],
    }),
    removeQuestionFromQuiz: builder.mutation<void, { quizId: number; questionId: number }>({
      query: ({ quizId, questionId }) => ({
        url: `/quizzes/${quizId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: "QuestionDTO", id: `Quiz-${quizId}` }, "QuizDTO"],
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
