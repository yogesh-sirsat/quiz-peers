export interface Option {
  option_id: number;
  question_id: number;
  option_text: string;
  image_url?: string;
  audio_url?: string;
  is_correct?: boolean;
}

export interface OptionCreateInput {
  questionId: number;
  optionText: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface OptionUpdateInput {
  optionText?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface QuizOption {
  optionId: number;
  questionId: number;
  optionText: string;
  imageUrl?: string;
  audioUrl?: string;
  option_id?: number;
  option_text?: string;
  image_url?: string;
  audio_url?: string;
}
