export interface QuizDTO {
  quizId: number;
  quizName: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'published' | 'testing' | 'draft';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  contestantsCount?: number;
  successRate?: number;
  questionsCount?: number;
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

export interface CategoryDTO {
  categoryId: number;
  categoryName: string;
}

export interface QuizParams {
  onlyValid?: boolean;
  includeTesting?: boolean;
}
