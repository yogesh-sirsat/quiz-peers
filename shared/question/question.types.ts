import { Option, QuizOption } from '../option/option.types';

export interface Question {
  question_id: number;
  question_text: string;
  quiz_id?: number;
  category_id?: number;
  category_name?: string;
  image_url?: string;
  audio_url?: string;
  difficulty: string;
  correct_option_id?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  options?: Option[];
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
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  correctOptionId?: number;
  options: QuizOption[];
  question_id?: number;
  question_text?: string;
  media_url?: string;
  media_type?: string;
}
