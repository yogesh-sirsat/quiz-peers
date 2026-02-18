export interface Quiz {
  quiz_id: number;
  quiz_name: string;
  description?: string;
  cover_image_url?: string;
  status?: 'published' | 'testing' | 'draft';
  created_at?: string | Date;
  updated_at?: string | Date;
  contestants_count?: number;
  success_rate?: number;
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

export interface Category {
  category_id: number;
  category_name: string;
}

export interface QuizParams {
  onlyValid?: boolean;
  includeTesting?: boolean;
}
