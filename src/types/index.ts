export type UserRole = 'admin' | 'aluno';

export interface User {
  id: number | string;
  phone: string;
  password?: string;
  name?: string;
  apelido?: string;
  birth_date?: string; // YYYY-MM-DD or DD/MM/YYYY
  corda?: string;
  role: UserRole;
  is_blocked?: boolean;
  created_at?: string;
}

export interface Song {
  id: number;
  title: string;
  author?: string;
  toque?: string;
  audio_url: string;
  lyrics?: string;
  duration?: string;
  created_at?: string;
  is_favorite?: boolean;
}

export interface LessonVideo {
  id: number;
  title: string;
  category?: string; // e.g. Movimentações Básicas, Floreios, Sequências, Bateria & Ritmo
  level?: string; // Iniciante, Intermediário, Avançado, Todos
  video_url?: string;
  youtube_url?: string;
  description?: string;
  duration?: string;
  created_at?: string;
}

export interface Playlist {
  id: number;
  user_phone: string;
  name: string;
  description?: string;
  created_at?: string;
  songs?: Song[];
}

export interface VideoItem {
  id: number;
  title: string;
  category?: string;
  youtube_url?: string;
  file_url?: string;
  description?: string;
  created_at?: string;
}

export interface PhotoItem {
  id: number;
  title: string;
  album?: string;
  image_url: string;
  description?: string;
  created_at?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  is_pinned?: boolean;
  created_at?: string;
}

export type RsvpStatus = 'vou' | 'nao_vou' | 'talvez';

export interface EventRSVP {
  event_id: number;
  user_phone: string;
  status: RsvpStatus;
  user_name?: string;
  user_apelido?: string;
}

export interface EventComment {
  id: number;
  event_id: number;
  user_phone: string;
  user_name: string;
  user_apelido?: string;
  comment: string;
  rating: number; // 1 - 5
  created_at?: string;
}

export interface EventItem {
  id: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  location?: string;
  created_at?: string;
  my_rsvp?: RsvpStatus | null;
  counts?: {
    vou: number;
    nao_vou: number;
    talvez: number;
  };
  rsvps?: EventRSVP[];
  comments?: EventComment[];
}

export interface ChatMessage {
  id: number;
  sender_phone: string;
  sender_name: string;
  recipient_phone: string;
  text: string;
  created_at: string;
  read?: boolean;
}

export interface CordaGraduation {
  id: string;
  name: string;
  category: 'adulto' | 'infantil';
  title?: string;
  colorLeft: string;
  colorRight?: string;
  meaning: string;
  symbol: string;
  description: string;
  level: number;
}
