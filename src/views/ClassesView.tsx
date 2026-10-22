import React, { useState, useEffect } from 'react';
import { LessonVideo } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  Play,
  Download,
  Trash2,
  Plus,
  Upload,
  Clock,
  Award,
  Video as VideoIcon,
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const ClassesView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [lessons, setLessons] = useState<LessonVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonVideo | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<LessonVideo | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedLevel, setSelectedLevel] = useState<string>('todos');

  // Admin Upload Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fundamentos da Ginga');
  const [level, setLevel] = useState('Iniciante');
  const [duration, setDuration] = useState('15 min');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    'todos',
    'Fundamentos da Ginga',
    'Movimentações & Golpes',
    'Esquivas & Defesas',
    'Floreios & Saltos',
    'Bateria & Ritmo',
    'Condicionamento Físico'
  ];

  const levels = ['todos', 'Iniciante', 'Intermediário', 'Avançado'];

  const fetchLessons = async () => {
    try {
      const res = await api.getLessons();
      setLessons(res.lessons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleDeviceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setVideoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!videoUrl && !youtubeUrl)) {
      alert('Por favor informe o título e envie o vídeo do dispositivo ou link do YouTube.');
      return;
    }

    setUploading(true);
    try {
      await api.createLesson({
        title,
        category,
        level,
        duration: duration || '15 min',
        video_url: videoUrl || undefined,
        youtube_url: youtubeUrl || undefined,
        description
      });

      setShowAddModal(false);
      setTitle('');
      setCategory('Fundamentos da Ginga');
      setLevel('Iniciante');
      setDuration('15 min');
      setYoutubeUrl('');
      setVideoUrl('');
      setDescription('');
      setUploadFile(null);
      await fetchLessons();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar aula.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLesson = (lesson: LessonVideo) => {
    setLessonToDelete(lesson);
  };

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await api.deleteLesson(lessonToDelete.id);
      setLessons(prev => prev.filter(l => String(l.id) !== String(lessonToDelete.id)));
      if (selectedLesson && String(selectedLesson.id) === String(lessonToDelete.id)) {
        setSelectedLesson(null);
      }
    } catch (err: any) {
      console.error('Erro ao excluir aula:', err);
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleDownloadVideo = (lesson: LessonVideo) => {
    if (lesson.video_url) {
      const link = document.createElement('a');
      link.href = lesson.video_url;
      link.download = `${lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (lesson.youtube_url) {
      window.open(lesson.youtube_url, '_blank');
    }
  };

  const filteredLessons = lessons.filter(l => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.category && l.category.toLowerCase().includes(search.toLowerCase())) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'todos' || l.category === selectedCategory;
    const matchesLevel = selectedLevel === 'todos' || l.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Treinamento & Metodologia
              </span>
              <span className="text-xs text-zinc-400">• Aulas em Vídeo com Upload</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Aulas Técnicas & Treinamento ABADÁ
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Aprimore seus movimentos, fundamentos, esquivas e toques de berimbau. Assista às videoaulas gravadas pelos mestres ou baixe para treinar onde estiver.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition self-start md:self-center`}
            >
              <Upload className="w-4 h-4" />
              Upload de Aula (ADM)
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Level Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-black font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lvl === 'todos' ? 'Todos os Níveis' : lvl}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por golpe, aula, movimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-zinc-500 shrink-0 mr-1">Categoria:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs shrink-0 font-medium transition ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-white font-bold border border-amber-500/50 shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat === 'todos' ? 'Todas as Categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Carregando catálogo de aulas...</div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <GraduationCap className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhuma videoaula encontrada</p>
          <p className="text-xs text-zinc-400 mt-1">Os administradores podem postar videoaulas fazendo upload direto do dispositivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => {
            const ytId = getYouTubeId(lesson.youtube_url);
            const thumbUrl = ytId
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
              : 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

            return (
              <div
                key={lesson.id}
                className="group rounded-3xl bg-zinc-950 border border-zinc-800/90 overflow-hidden hover:border-zinc-700 transition flex flex-col justify-between"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => setSelectedLesson(lesson)}
                  className="relative aspect-video bg-zinc-900 cursor-pointer overflow-hidden"
                >
                  {lesson.video_url && !lesson.youtube_url ? (
                    <video
                      src={lesson.video_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={thumbUrl}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md text-amber-400 border border-zinc-700">
                    {lesson.category || 'ABADÁ'}
                  </span>

                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/80 text-white flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {lesson.duration || '15 min'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {lesson.level || 'Todos os Níveis'}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedLesson(lesson)}
                      className="font-bold text-white text-base hover:text-amber-400 cursor-pointer transition line-clamp-2 leading-snug"
                    >
                      {lesson.title}
                    </h3>

                    {lesson.description && (
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedLesson(lesson)}
                      className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Assistir Aula
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadVideo(lesson)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                        title="Baixar videoaula no dispositivo"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteLesson(lesson)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                          title="Excluir aula"
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

      {/* Lesson Player Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">{selectedLesson.title}</h3>
                <span className="text-xs text-amber-400 font-medium">
                  {selectedLesson.category} • Nível: {selectedLesson.level}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadVideo(selectedLesson)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                  title="Baixar aula"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Aula
                </button>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {getYouTubeId(selectedLesson.youtube_url) ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(selectedLesson.youtube_url)}?autoplay=1&rel=0`}
                  title={selectedLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedLesson.video_url ? (
                <video
                  src={selectedLesson.video_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  Vídeo indisponível para exibição.
                </div>
              )}
            </div>

            {selectedLesson.description && (
              <div className="p-5 bg-zinc-900/50 text-xs sm:text-sm text-zinc-300 space-y-1">
                <h4 className="font-semibold text-white">Instruções & Dicas do Treino:</h4>
                <p className="leading-relaxed whitespace-pre-line">{selectedLesson.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Upload Lesson Modal (with device video file upload) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              Postar Nova Videoaula (ADM)
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Envie o arquivo de vídeo diretamente do seu dispositivo ou informe link do YouTube.
            </p>

            <form onSubmit={handleAddLesson} className="space-y-4">
              {/* Device Video File Upload Picker */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Arquivo de Vídeo do Dispositivo (.mp4, .mov, .webm)
                </label>
                <div className="p-4 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-center hover:border-amber-500/50 transition">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleDeviceFileChange}
                    className="hidden"
                    id="lesson-file-input"
                  />
                  <label htmlFor="lesson-file-input" className="cursor-pointer block">
                    <VideoIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-white block">
                      {uploadFile ? uploadFile.name : 'Clique para selecionar vídeo do seu dispositivo'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Suporta gravações da câmera do smartphone ou arquivos do computador
                    </span>
                  </label>
                </div>
              </div>

              {/* Or YouTube URL */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Ou Link do YouTube
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título da Aula <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Treino de Esquiva Lateral e Martelo Rodado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter(c => c !== 'todos').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Nível de Habilidade</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Todos">Todos os Níveis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Duração Estimada</label>
                <input
                  type="text"
                  placeholder="Ex: 15 min, 30 min"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  Descrição Técnica & Dicas de Execução
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique os pontos de atenção: postura, respiração, segurança articular e repetições..."
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
                  disabled={uploading}
                  className={`px-5 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs disabled:opacity-50`}
                >
                  {uploading ? 'Enviando Aula...' : 'Salvar Videoaula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!lessonToDelete}
        title="Excluir Videoaula"
        message={`Tem certeza que deseja excluir a aula "${lessonToDelete?.title}" do portal?`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLessonToDelete(null)}
      />
    </div>
  );
};
