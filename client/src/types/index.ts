export interface Quiz {
  quiz_id: string;
  quiz_name: string;
  description?: string;
  cover_image_url?: string;
  success_rate?: number;
  status?: 'published' | 'testing' | 'draft';
  contestants_count?: number;
  questions_count?: number;
  categories?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  question_id: string;
  questionId?: string;
  question_text: string;
  questionText?: string;
  media_url?: string;
  imageUrl?: string;
  audioUrl?: string;
  media_type?: string;
  options: {
    optionId: string;
    option_id?: string;
    option_text?: string;
    optionText?: string;
    image_url?: string;
    imageUrl?: string;
    audio_url?: string;
    audioUrl?: string;
  }[];
}

export interface LeaderboardEntry {
  peerId: string;
  playerName: string;
  score: number;
}

export interface Question {
  question_id: string;
  questionId?: string; // Sometimes used as camelCase in components
  quiz_id: string;
  question_text: string;
  questionText?: string; // camelCase
  media_url?: string;
  imageUrl?: string; // camelCase
  audioUrl?: string; // camelCase
  media_type?: 'image' | 'video';
  points?: number;
  time_limit?: number;
  difficulty?: string;
  categoryId?: string | number;
  correctOptionId?: string | number;
  options?: Option[];
}

export interface Option {
  option_id: string;
  question_id: string;
  option_text: string;
  optionText?: string; // camelCase
  is_correct: boolean;
  image_url?: string;
  audio_url?: string;
}

export interface Category {
  category_id: string | number;
  category_name: string;
}

export interface Room {
  room_id: string;
  quiz_id: string;
  room_type: 'public' | 'private';
  created_at?: string;
}

export interface RoomDetails extends Room {
  quiz: Quiz;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface RoomPlayer {
  peerId: string;
  name?: string;
  isMute?: boolean;
  isLocal?: boolean;
  score?: number;
  [key: string]: any; // To allow other dynamic properties
}

export interface QuizParams {
  onlyValid?: boolean;
  includeTesting?: boolean;
}
