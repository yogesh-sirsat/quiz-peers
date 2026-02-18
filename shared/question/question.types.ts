import { OptionDTO, QuizOption } from '../option/option.types';

export interface QuestionDTO {
  questionId: number;
  questionText: string;
  quizId?: number;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  correctOptionId?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  options?: OptionDTO[];
}

export interface QuestionCreateInput {
  questionText: string;
  categoryId?: number;
  imageUrl?: string;
  audioUrl?: string;
  difficulty?: string;
}

export interface QuestionUpdateInput {
  questionText?: string;
  categoryId?: number;
  imageUrl?: string;
  audioUrl?: string;
  difficulty?: string;
}

export interface QuizQuestion {
  questionId: number;
  questionText: string;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  correctOptionId?: number;
  options: QuizOption[];
}
