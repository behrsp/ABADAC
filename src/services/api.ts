import { User, Song, Playlist, VideoItem, PhotoItem, Announcement, EventItem, ChatMessage, RsvpStatus } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(phone: string, password: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao realizar login');
    return data;
  },

  async register(params: {
    phone: string;
    password: string;
    name?: string;
    apelido?: string;
    birth_date?: string;
    corda?: string;
  }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
    return data;
  },

  async getProfile(phone: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/users/me?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar perfil');
    return data;
  },

  async updateProfile(params: {
    phone: string;
    name?: string;
    apelido?: string;
    birth_date?: string;
    corda?: string;
    password?: string;
  }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados');
    return data;
  },

  // Admin User Management
  async getAllUsers(role?: string): Promise<{ users: User[] }> {
    const url = role ? `${API_BASE}/users?role=${role}` : `${API_BASE}/users`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários');
    return data;
  },

  async updateUserRole(phone: string, role: 'admin' | 'aluno'): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(phone)}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar cargo');
  },

  async toggleBlockUser(phone: string, is_blocked: boolean): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(phone)}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar bloqueio');
  },

  async editUser(phone: string, updateData: Partial<User> & { new_phone?: string; password?: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(phone)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados do aluno');
  },

  async deleteUser(phone: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(phone)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir aluno');
  },

  // Songs
  async getSongs(userPhone?: string): Promise<{ songs: Song[] }> {
    const url = userPhone ? `${API_BASE}/songs?user_phone=${encodeURIComponent(userPhone)}` : `${API_BASE}/songs`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar músicas');
    return data;
  },

  async createSong(songData: Partial<Song>): Promise<{ song: Song }> {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao adicionar música');
    return data;
  },

  async deleteSong(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/songs/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir música');
  },

  async toggleFavorite(userPhone: string, songId: number): Promise<{ is_favorite: boolean }> {
    const res = await fetch(`${API_BASE}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_phone: userPhone, song_id: songId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao favoritar música');
    return data;
  },

  // Playlists
  async getPlaylists(userPhone: string): Promise<{ playlists: Playlist[] }> {
    const res = await fetch(`${API_BASE}/playlists?user_phone=${encodeURIComponent(userPhone)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar playlists');
    return data;
  },

  async createPlaylist(userPhone: string, name: string, description?: string): Promise<{ playlist: Playlist }> {
    const res = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_phone: userPhone, name, description })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar playlist');
    return data;
  },

  async addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: songId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao adicionar à playlist');
  },

  async removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao remover da playlist');
  },

  async deletePlaylist(playlistId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir playlist');
  },

  // Videos
  async getVideos(): Promise<{ videos: VideoItem[] }> {
    const res = await fetch(`${API_BASE}/videos`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar vídeos');
    return data;
  },

  async createVideo(video: Partial<VideoItem>): Promise<{ video: VideoItem }> {
    const res = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar vídeo');
    return data;
  },

  async deleteVideo(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir vídeo');
  },

  // Photos
  async getPhotos(): Promise<{ photos: PhotoItem[] }> {
    const res = await fetch(`${API_BASE}/photos`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar fotos');
    return data;
  },

  async createPhoto(photo: Partial<PhotoItem>): Promise<{ photo: PhotoItem }> {
    const res = await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao adicionar foto');
    return data;
  },

  async deletePhoto(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/photos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir foto');
  },

  // Announcements
  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    const res = await fetch(`${API_BASE}/announcements`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar recados');
    return data;
  },

  async createAnnouncement(ann: Partial<Announcement>): Promise<{ announcement: Announcement }> {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ann)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao postar recado');
    return data;
  },

  async deleteAnnouncement(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir recado');
  },

  // Birthdays
  async getBirthdays(month?: number): Promise<{ current_month: number; total: number; users: User[] }> {
    const url = month ? `${API_BASE}/birthdays?month=${month}` : `${API_BASE}/birthdays`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar aniversariantes');
    return data;
  },

  // Events
  async getEvents(userPhone?: string): Promise<{ events: EventItem[] }> {
    const url = userPhone ? `${API_BASE}/events?user_phone=${encodeURIComponent(userPhone)}` : `${API_BASE}/events`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar eventos');
    return data;
  },

  async createEvent(eventData: Partial<EventItem>): Promise<{ event: EventItem }> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar evento');
    return data;
  },

  async deleteEvent(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir evento');
  },

  async setRsvp(eventId: number, userPhone: string, status: RsvpStatus, userName: string, userApelido?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_phone: userPhone,
        status,
        user_name: userName,
        user_apelido: userApelido
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar confirmação');
  },

  async addComment(eventId: number, userPhone: string, userName: string, userApelido: string, comment: string, rating: number): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_phone: userPhone,
        user_name: userName,
        user_apelido: userApelido,
        comment,
        rating
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar comentário');
  },

  // Internal Chat
  async getAdmins(): Promise<{ admins: User[] }> {
    const res = await fetch(`${API_BASE}/chat/admins`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar administradores');
    return data;
  },

  async getAdminThreads(adminPhone: string): Promise<{ threads: any[] }> {
    const res = await fetch(`${API_BASE}/chat/threads?admin_phone=${encodeURIComponent(adminPhone)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar conversas');
    return data;
  },

  async getMessages(user1: string, user2: string): Promise<{ messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE}/chat/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar mensagens');
    return data;
  },

  async sendMessage(senderPhone: string, senderName: string, recipientPhone: string, text: string): Promise<{ message: ChatMessage }> {
    const res = await fetch(`${API_BASE}/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_phone: senderPhone,
        sender_name: senderName,
        recipient_phone: recipientPhone,
        text
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem');
    return data;
  },

  async markAsRead(readerPhone: string, senderPhone: string): Promise<void> {
    await fetch(`${API_BASE}/chat/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reader_phone: readerPhone, sender_phone: senderPhone })
    });
  },

  // Lessons (Aulas)
  async getLessons(): Promise<{ lessons: any[] }> {
    const res = await fetch(`${API_BASE}/lessons`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar aulas');
    return data;
  },

  async createLesson(lesson: {
    title: string;
    category?: string;
    level?: string;
    video_url?: string;
    youtube_url?: string;
    duration?: string;
    description?: string;
  }): Promise<{ lesson: any }> {
    const res = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lesson)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar aula');
    return data;
  },

  async deleteLesson(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/lessons/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir aula');
  },

  // Stats
  async getStats(): Promise<{ totalUsers: number; totalSongs: number; totalLessons: number; totalVideos: number; totalPhotos: number; totalEvents: number; database: string }> {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar estatísticas');
    return data;
  }
};
