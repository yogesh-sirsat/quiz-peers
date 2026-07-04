export interface OptionDTO {
  optionId: number;
  questionId: number;
  optionText: string;
  imageUrl?: string;
  audioUrl?: string;
  isCorrect?: boolean;
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
}
