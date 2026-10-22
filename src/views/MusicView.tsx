import React, { useState, useEffect } from 'react';
import { Song, Playlist } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Plus,
  Play,
  Pause,
  Heart,
  FileText,
  Download,
  ListMusic,
  Trash2,
  FolderPlus,
  Music2,
  Upload,
  Check,
  Disc3,
  X
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const MusicView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay, setShowLyricsModal, downloadSong } = useAudio();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'favorites' | 'playlists'>('all');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState<Song | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'song' | 'playlist'; id: number; title: string } | null>(null);

  // New Song Form (Admin)
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // New Playlist Form
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  const fetchSongs = async () => {
    try {
      const res = await api.getSongs(user?.phone);
      setSongs(res.songs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    if (!user) return;
    try {
      const res = await api.getPlaylists(user.phone);
      setPlaylists(res.playlists);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSongs();
    if (user) fetchPlaylists();
  }, [user?.phone]);

  const handleToggleFavorite = async (song: Song) => {
    if (!user) {
      alert('Faça login com seu celular para salvar músicas favoritas.');
      return;
    }
    try {
      const res = await api.toggleFavorite(user.phone, song.id);
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_favorite: res.is_favorite } : s));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewAudioUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAudioUrl) {
      alert('Por favor informe o título e envie o áudio MP3.');
      return;
    }

    setUploading(true);
    try {
      await api.createSong({
        title: newTitle,
        author: newAuthor || 'ABADÁ-Capoeira',
        lyrics: newLyrics,
        audio_url: newAudioUrl,
        duration: '03:15'
      });
      setShowUploadModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewLyrics('');
      setNewAudioUrl('');
      setUploadFile(null);
      await fetchSongs();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar upload da música.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = (song: Song) => {
    setItemToDelete({ type: 'song', id: song.id, title: song.title });
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    setItemToDelete({ type: 'playlist', id: playlist.id, title: playlist.name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'song') {
        await api.deleteSong(itemToDelete.id);
        setSongs(prev => prev.filter(s => String(s.id) !== String(itemToDelete.id)));
        if (currentSong && String(currentSong.id) === String(itemToDelete.id) && isPlaying) {
          togglePlay();
        }
      } else {
        await api.deletePlaylist(itemToDelete.id);
        setPlaylists(prev => prev.filter(p => String(p.id) !== String(itemToDelete.id)));
      }
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !playlistName) return;
    try {
      await api.createPlaylist(user.phone, playlistName, playlistDesc);
      setPlaylistName('');
      setPlaylistDesc('');
      setShowCreatePlaylistModal(false);
      await fetchPlaylists();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSongToPlaylist = async (playlistId: number, songId: number) => {
    try {
      await api.addSongToPlaylist(playlistId, songId);
      setShowAddToPlaylistModal(null);
      await fetchPlaylists();
      alert('Música adicionada à playlist com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Songs (without toque)
  const filteredSongs = songs.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.author && s.author.toLowerCase().includes(search.toLowerCase())) ||
      (s.lyrics && s.lyrics.toLowerCase().includes(search.toLowerCase()));

    const matchesFavorite = viewFilter !== 'favorites' || s.is_favorite;

    return matchesSearch && matchesFavorite;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Streaming de Capoeira
              </span>
              <span className="text-xs text-zinc-400">• Áudios em MP3</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Cantigas, Corridos & Ladainhas
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Ouça, treine e cante com as letras sincronizadas. Baixe para o seu celular ou monte suas próprias playlists para os treinos de roda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <button
                onClick={() => setShowCreatePlaylistModal(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                Criar Playlist
              </button>
            )}

            {/* Admin Upload Button */}
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition`}
              >
                <Upload className="w-4 h-4" />
                Upload de MP3 (ADM)
              </button>
            )}
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                viewFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas as Músicas ({songs.length})
            </button>
            {user && (
              <>
                <button
                  onClick={() => setViewFilter('favorites')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewFilter === 'favorites'
                      ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  Minhas Favoritas
                </button>
                <button
                  onClick={() => setViewFilter('playlists')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewFilter === 'playlists'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                  Minhas Playlists ({playlists.length})
                </button>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por letra, título, mestre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Playlist View Mode */}
      {viewFilter === 'playlists' && (
        <div className="space-y-6">
          {playlists.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-3xl">
              <ListMusic className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhuma playlist criada ainda</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Crie listas personalizadas para aquecimento, jogos de Benguela, rodas de formatura e muito mais.
              </p>
              <button
                onClick={() => setShowCreatePlaylistModal(true)}
                className={`mt-4 px-4 py-2 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs`}
              >
                Criar Primeira Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ListMusic className="w-5 h-5 text-amber-400" />
                      </div>
                      <button
                        onClick={() => handleDeletePlaylist(pl)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                        title="Excluir Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-white text-base">{pl.name}</h3>
                    {pl.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{pl.description}</p>
                    )}
                    <span className="text-[11px] text-zinc-500 mt-2 block">
                      {pl.songs ? pl.songs.length : 0} música(s) adicionada(s)
                    </span>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-900 flex items-center justify-between">
                    {pl.songs && pl.songs.length > 0 ? (
                      <button
                        onClick={() => playSong(pl.songs![0], pl.songs)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 hover:bg-amber-400 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Tocar Playlist
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">Vazia</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Songs List */}
      {viewFilter !== 'playlists' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 text-sm">Carregando acervo de músicas...</div>
          ) : filteredSongs.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <Disc3 className="w-12 h-12 text-zinc-600 mx-auto mb-2 animate-spin-slow" />
              <p className="text-white font-bold text-base">Nenhuma música encontrada</p>
              <p className="text-xs text-zinc-400 mt-1">Tente pesquisar outro toque ou termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredSongs.map((song) => {
                const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying;
                const isCurrent = currentSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    className={`p-3 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-zinc-900/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    {/* Play Button & Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            togglePlay();
                          } else {
                            playSong(song, filteredSongs);
                          }
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                          isCurrentlyPlaying
                            ? 'bg-amber-500 text-black font-bold scale-105'
                            : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current translate-x-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-white truncate">
                            {song.title}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {song.author || 'ABADÁ-Capoeira'} {song.duration ? `• ${song.duration}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {/* Lyrics button */}
                      <button
                        onClick={() => {
                          playSong(song, filteredSongs);
                          setShowLyricsModal(true);
                        }}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition"
                        title="Ver Letra Completa"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Download song */}
                      <button
                        onClick={() => downloadSong(song)}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                        title="Baixar MP3 no celular/computador"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Favorite button */}
                      <button
                        onClick={() => handleToggleFavorite(song)}
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition"
                        title={song.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* Add to playlist */}
                      {user && playlists.length > 0 && (
                        <button
                          onClick={() => setShowAddToPlaylistModal(song)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition"
                          title="Adicionar à Playlist"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}

                      {/* Admin delete */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSong(song)}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                          title="Excluir música do acervo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload de Música (MP3)</h3>
                <p className="text-xs text-zinc-400">Somente administradores podem adicionar ao acervo</p>
              </div>
            </div>

            <form onSubmit={handleUploadSong} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Arquivo de Áudio (.mp3) <span className="text-amber-400">*</span>
                </label>
                <div className="p-4 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-center hover:border-amber-500/50 transition">
                  <input
                    type="file"
                    accept="audio/mp3,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="audio-upload-input"
                  />
                  <label htmlFor="audio-upload-input" className="cursor-pointer block">
                    <Music2 className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-white block">
                      {uploadFile ? uploadFile.name : 'Clique para selecionar arquivo MP3'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Suporta arquivos de áudio do seu computador ou smartphone
                    </span>
                  </label>
                </div>
              </div>

              {/* Or manual URL */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Ou URL direta do Áudio MP3
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/musica.mp3"
                  value={newAudioUrl.startsWith('data:') ? '' : newAudioUrl}
                  onChange={(e) => setNewAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título da Canção <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Marinheiro Só / Vou Vencer na Capoeira"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Autor / Mestre</label>
                <input
                  type="text"
                  placeholder="Ex: Mestre Camisa / Tradicional ABADÁ"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Letra Completa da Música
                </label>
                <textarea
                  rows={4}
                  placeholder="Cole aqui a letra com estrofes e coro para os alunos poderem cantar..."
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-5 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition`}
                >
                  {uploading ? 'Salvando...' : 'Salvar no Acervo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowCreatePlaylistModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Nova Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Nome da Playlist</label>
                <input
                  type="text"
                  placeholder="Ex: Treino de Benguela"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Cantigas cadenciadas para esquivas"
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs`}
              >
                Criar Playlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      {showAddToPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowAddToPlaylistModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-2">Adicionar à Playlist</h3>
            <p className="text-xs text-zinc-400 mb-4">{showAddToPlaylistModal.title}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAddSongToPlaylist(pl.id, showAddToPlaylistModal.id)}
                  className="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs text-white font-medium flex items-center justify-between transition"
                >
                  <span>{pl.name}</span>
                  <Plus className="w-4 h-4 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title={itemToDelete?.type === 'song' ? 'Excluir Música' : 'Excluir Playlist'}
        message={
          itemToDelete?.type === 'song'
            ? `Tem certeza que deseja remover permanentemente a música "${itemToDelete?.title}" do acervo?`
            : `Tem certeza que deseja excluir a playlist "${itemToDelete?.title}"? As músicas continuarão no acervo geral.`
        }
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
