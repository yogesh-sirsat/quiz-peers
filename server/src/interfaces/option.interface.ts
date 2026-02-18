export interface Option {
  option_id: number;
  question_id: number;
  option_text: string;
  image_url?: string;
  audio_url?: string;
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
