import React, { useState, useEffect } from 'react';
import { VideoItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Video as VideoIcon,
  Play,
  Download,
  Trash2,
  Plus,
  Youtube,
  Film,
  X,
  ExternalLink
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const VideosView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);

  // Admin Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Geral');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await api.getVideos();
      setVideos(res.videos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!youtubeUrl && !fileUrl)) {
      alert('Informe o título e link do YouTube ou arquivo de vídeo.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createVideo({
        title,
        category,
        youtube_url: youtubeUrl || undefined,
        file_url: fileUrl || undefined,
        description
      });
      setShowAddModal(false);
      setTitle('');
      setYoutubeUrl('');
      setFileUrl('');
      setDescription('');
      await fetchVideos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = (video: VideoItem) => {
    setVideoToDelete(video);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await api.deleteVideo(videoToDelete.id);
      setVideos(prev => prev.filter(v => String(v.id) !== String(videoToDelete.id)));
      if (selectedVideo && String(selectedVideo.id) === String(videoToDelete.id)) {
        setSelectedVideo(null);
      }
    } catch (err: any) {
      console.error('Erro ao excluir vídeo:', err);
    } finally {
      setVideoToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                Acervo Audiovisual
              </span>
              <span className="text-xs text-zinc-400">• YouTube & Downloads</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Vídeos Técnicos, Jogos & Aulas
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Assista apresentações de alta graduação, registros dos Jogos Mundiais e vídeos didáticos para aperfeiçoar seu jogo de capoeira.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition`}
            >
              <Plus className="w-4 h-4" />
              Adicionar Vídeo (ADM)
            </button>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Carregando acervo de vídeos...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhum vídeo cadastrado</p>
          <p className="text-xs text-zinc-400 mt-1">Os administradores podem adicionar links do YouTube ou arquivos para download.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((vid) => {
            const ytId = getYouTubeId(vid.youtube_url);
            const thumbUrl = ytId
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';

            return (
              <div
                key={vid.id}
                className="group rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden hover:border-zinc-700 transition flex flex-col justify-between"
              >
                {/* Thumbnail with play overlay */}
                <div
                  onClick={() => setSelectedVideo(vid)}
                  className="relative aspect-video bg-zinc-900 cursor-pointer overflow-hidden"
                >
                  <img
                    src={thumbUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-md text-amber-400 border border-zinc-700">
                    {vid.category || 'ABADÁ'}
                  </span>

                  {vid.youtube_url && (
                    <span className="absolute top-3 right-3 p-1.5 rounded-full bg-red-600/90 text-white">
                      <Youtube className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => setSelectedVideo(vid)}
                      className="font-bold text-white text-base hover:text-amber-400 cursor-pointer transition line-clamp-1"
                    >
                      {vid.title}
                    </h3>
                    {vid.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedVideo(vid)}
                      className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Assistir Agora
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Download link if available */}
                      {vid.file_url ? (
                        <a
                          href={vid.file_url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
                          title="Baixar arquivo de vídeo"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : vid.youtube_url ? (
                        <a
                          href={vid.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-red-400"
                          title="Abrir no YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : null}

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteVideo(vid)}
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-400 transition"
                          title="Excluir vídeo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">{selectedVideo.title}</h3>
                <span className="text-xs text-amber-400 font-medium">{selectedVideo.category}</span>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {getYouTubeId(selectedVideo.youtube_url) ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.youtube_url)}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedVideo.file_url ? (
                <video
                  src={selectedVideo.file_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  Vídeo indisponível para pré-visualização.
                </div>
              )}
            </div>

            {selectedVideo.description && (
              <div className="p-4 sm:p-5 bg-zinc-900/50 text-xs sm:text-sm text-zinc-300">
                {selectedVideo.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Video Modal (Admin) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-amber-400" />
              Adicionar Vídeo ao Acervo
            </h3>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título do Vídeo <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Formatura Mestre Camisa 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Jogos Mundiais, Fundamentos, Roda Aberta"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Link do YouTube (Para exibição rápida)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Ou Link de Arquivo de Vídeo (Para download)
                </label>
                <input
                  type="url"
                  placeholder="https://servidor.com/video.mp4"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes sobre a roda, participantes e técnicas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs disabled:opacity-50`}
                >
                  {submitting ? 'Salvando...' : 'Salvar Vídeo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!videoToDelete}
        title="Excluir Vídeo"
        message={`Tem certeza que deseja remover o vídeo "${videoToDelete?.title}" do acervo?`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setVideoToDelete(null)}
      />
    </div>
  );
};
