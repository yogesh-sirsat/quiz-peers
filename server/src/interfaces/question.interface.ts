export interface Question {
  question_id: number;
  question_text: string;
  category_id?: number;
  category_name?: string;
  image_url?: string;
  audio_url?: string;
  difficulty: string;
  correct_option_id?: number;
  created_at?: Date;
  updated_at?: Date;
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
