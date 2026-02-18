export interface Quiz {
  quiz_id: number;
  quiz_name: string;
  description: string;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'testing';
  created_at: Date;
  updated_at?: Date;
  contestants_count: number;
  success_rate: number;
  questions_count?: number;
  categories?: string[];
}

export interface QuizCreateInput {
  quizName: string;
  description: string;
  coverImageUrl?: string;
  status?: 'draft' | 'published' | 'testing';
}

export interface QuizUpdateInput {
  quizName?: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'draft' | 'published' | 'testing';
}

export interface QuizOption {
  optionId: number;
  questionId: number;
  optionText: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface QuizQuestion {
  questionId: number;
  questionText: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  correctOptionId: number;
  options: QuizOption[];
}

export interface Category {
  category_id: number;
  category_name: string;
}
