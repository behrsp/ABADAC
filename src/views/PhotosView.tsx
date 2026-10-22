import React, { useState, useEffect } from 'react';
import { PhotoItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
  Upload,
  X,
  Maximize2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const PhotosView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('todos');
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);

  // Admin Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('Rodas Oficiais');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPhotos = async () => {
    try {
      const res = await api.getPhotos();
      setPhotos(res.photos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const albums = ['todos', ...Array.from(new Set(photos.map(p => p.album || 'Geral')))];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert('Informe o título e selecione uma imagem.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPhoto({
        title,
        album,
        image_url: imageUrl,
        description
      });
      setShowAddModal(false);
      setTitle('');
      setImageUrl('');
      setDescription('');
      setUploadFile(null);
      await fetchPhotos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhoto = (photo: PhotoItem) => {
    setPhotoToDelete(photo);
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await api.deletePhoto(photoToDelete.id);
      setPhotos(prev => prev.filter(p => String(p.id) !== String(photoToDelete.id)));
      if (selectedPhoto && String(selectedPhoto.id) === String(photoToDelete.id)) {
        setSelectedPhoto(null);
      }
    } catch (err: any) {
      console.error('Erro ao excluir foto:', err);
    } finally {
      setPhotoToDelete(null);
    }
  };

  const handleDownload = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.image_url;
    link.download = `${photo.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPhotos = selectedAlbum === 'todos'
    ? photos
    : photos.filter(p => (p.album || 'Geral') === selectedAlbum);

  return (
    <div className="space-y-6 pb-28">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Galeria de Fotos
              </span>
              <span className="text-xs text-zinc-400">• Alta Resolução</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Memória & Momentos da Capoeira
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Confira os registros de batizados, rodas especiais, cursos com mestres e viagens. Baixe as fotos em alta qualidade para recordar.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition`}
            >
              <Upload className="w-4 h-4" />
              Upload de Foto (ADM)
            </button>
          )}
        </div>
      </div>

      {/* Album Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-zinc-500 shrink-0 mr-1">Álbum:</span>
        {albums.map((alb) => (
          <button
            key={alb}
            onClick={() => setSelectedAlbum(alb)}
            className={`px-3.5 py-1.5 rounded-full text-xs shrink-0 font-medium capitalize transition ${
              selectedAlbum === alb
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {alb}
          </button>
        ))}
      </div>

      {/* Photos Masonry/Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Carregando galeria de fotos...</div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhuma foto encontrada</p>
          <p className="text-xs text-zinc-400 mt-1">Os administradores podem fazer upload de fotos a qualquer momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition"
            >
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square w-full bg-zinc-900 cursor-pointer overflow-hidden relative"
              >
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition p-4 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <span className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      {photo.album || 'ABADÁ'}
                    </span>
                    <h4 className="text-white font-bold text-sm truncate">{photo.title}</h4>
                  </div>
                </div>
              </div>

              {/* Bottom quick bar */}
              <div className="p-3 bg-zinc-950 flex items-center justify-between border-t border-zinc-900">
                <span className="text-xs font-semibold text-zinc-300 truncate max-w-[140px]">
                  {photo.title}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(photo)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                    title="Baixar imagem no dispositivo"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md">
          <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between p-3 text-white mb-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg">{selectedPhoto.title}</h3>
                <span className="text-xs text-amber-400">{selectedPhoto.album || 'ABADÁ'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold flex items-center gap-2 hover:bg-amber-400 transition"
                >
                  <Download className="w-4 h-4" />
                  Baixar Foto
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative max-h-[75vh] w-full flex items-center justify-center rounded-2xl overflow-hidden border border-zinc-800 bg-black">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            {selectedPhoto.description && (
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 text-center max-w-xl">
                {selectedPhoto.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Admin Upload Modal */}
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
              <ImageIcon className="w-5 h-5 text-amber-400" />
              Upload de Foto (ADM)
            </h3>

            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Arquivo de Imagem <span className="text-amber-400">*</span>
                </label>
                <div className="p-4 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-center hover:border-amber-500/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload-input"
                  />
                  <label htmlFor="photo-upload-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-white block">
                      {uploadFile ? uploadFile.name : 'Selecionar foto do dispositivo'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      JPG, PNG, WebP do seu computador ou celular
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ou URL da imagem</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título da Foto <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Formatura Batizado 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Álbum</label>
                <input
                  type="text"
                  placeholder="Ex: Rodas Oficiais, Batizados, Cursos"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Legenda / Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Local, mestres presentes e detalhes da ocasião..."
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
                  {submitting ? 'Salvando...' : 'Salvar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        title="Excluir Fotografia"
        message={`Tem certeza que deseja remover a foto "${photoToDelete?.title}" da galeria?`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
};
