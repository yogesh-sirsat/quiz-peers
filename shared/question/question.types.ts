import { OptionDTO, QuizOption } from '../option/option.types';

export type QuestionType = 'TRIVIA' | 'SIMILARITY' | 'MAJORITY';
export type GameMode = 'TRIVIA' | 'SIMILARITY';

export interface QuestionDTO {
  questionId: number;
  questionText: string;
  quizId?: number;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  qtype?: QuestionType;
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
  qtype?: QuestionType;
}

export interface QuestionUpdateInput {
  questionText?: string;
  categoryId?: number;
  imageUrl?: string;
  audioUrl?: string;
  difficulty?: string;
  qtype?: QuestionType;
}

export interface QuizQuestion {
  questionId: number;
  questionText: string;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  audioUrl?: string;
  difficulty: string;
  qtype?: QuestionType;
  correctOptionId?: number;
  options: QuizOption[];
}

export interface PairSimilarity {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  similarityCount: number;
}

export interface SimilarityPublicStats {
  loneWolf: { peerId: string; playerName: string; averageSimilarity: number } | null;
  soulmate: PairSimilarity | null;
  mostPopularPicker: { peerId: string; playerName: string; count: number } | null;
  chaosPicker: { peerId: string; playerName: string; count: number } | null;
}

export interface SimilarityQuestionBreakdown {
  questionId: number;
  questionText: string;
  options: Array<{
    optionId: number;
    optionText: string;
    imageUrl?: string;
    audioUrl?: string;
    players: Array<{ peerId: string; playerName: string }>;
  }>;
}

export interface SimilaritySessionResult {
  pairwise: PairSimilarity[];
  publicStats: SimilarityPublicStats;
  questionBreakdown: SimilarityQuestionBreakdown[];
  perPlayerSimilarity: Record<string, Array<{ peerId: string; playerName: string; similarityCount: number }>>;
}
