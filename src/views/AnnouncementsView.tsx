import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  Pin,
  Plus,
  Trash2,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const AnnouncementsView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('unsupported');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações Push nativas.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      new Notification('ABADÁ-Capoeira - Mural de Recados', {
        body: 'Notificações Push ativadas! Você será avisado de comunicados importantes.',
        icon: '/favicon.ico'
      });
      setToastMessage('Notificações ativadas com sucesso!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      const author = user?.apelido
        ? `${user.name || 'Admin'} (${user.apelido})`
        : user?.name || 'Mestre Administrador';

      await api.createAnnouncement({
        title,
        content,
        author_name: author,
        is_pinned: isPinned
      });

      // Trigger Web Push Notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Novo Recado ABADÁ: ${title}`, {
          body: content.slice(0, 100),
          icon: '/favicon.ico'
        });
      }

      setToastMessage(`Recado publicado e enviado para todos os alunos!`);
      setTimeout(() => setToastMessage(null), 5000);

      setShowAddModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = (ann: Announcement) => {
    setAnnouncementToDelete(ann);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await api.deleteAnnouncement(announcementToDelete.id);
      setAnnouncements(prev => prev.filter(a => String(a.id) !== String(announcementToDelete.id)));
    } catch (err: any) {
      console.error('Erro ao excluir recado:', err);
    } finally {
      setAnnouncementToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Toast Alert for Push feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-amber-500 text-black font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Mural de Recados
              </span>
              <span className="text-xs text-zinc-400">• Comunicados Oficiais</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Avisos da Mestria & Secretaria
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Fique por dentro das datas de batizados, taxas de graduação, treinos especiais, uniformes e avisos urgentes para toda a família ABADÁ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {notificationStatus !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition"
                title="Receber avisos no navegador"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                Ativar Notificações Push
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition`}
              >
                <Plus className="w-4 h-4" />
                Publicar Recado (ADM)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Carregando mural...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhum recado publicado no momento</p>
          <p className="text-xs text-zinc-400 mt-1">Os administradores podem postar avisos a qualquer momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-5 sm:p-6 rounded-3xl border transition relative flex flex-col justify-between ${
                ann.is_pinned
                  ? 'bg-zinc-900/70 border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {ann.is_pinned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        Fixado
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-500">
                      {ann.created_at ? new Date(ann.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteAnnouncement(ann)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition"
                      title="Excluir comunicado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                  {ann.title}
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
                <span className="font-medium text-zinc-400">
                  Por: <strong className="text-zinc-200">{ann.author_name || 'Mestre Administrador'}</strong>
                </span>
                <span className="text-[11px] text-amber-500/80">ABADÁ Oficial</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Post Modal */}
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
              <Bell className="w-5 h-5 text-amber-400" />
              Publicar Recado no Mural (ADM)
            </h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título do Aviso <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roda Oficial com Convidados Especiais"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Texto do Recado <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Digite aqui as instruções, horários, vestimenta e recomendações..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned-checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded-sm bg-zinc-900 border-zinc-700 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="pinned-checkbox" className="text-xs text-zinc-300 cursor-pointer">
                  Destacar e Fixar este comunicado no topo do mural
                </label>
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
                  {submitting ? 'Publicando...' : 'Publicar e Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!announcementToDelete}
        title="Excluir Comunicado"
        message={`Tem certeza que deseja excluir o recado "${announcementToDelete?.title}" do mural?`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setAnnouncementToDelete(null)}
      />
    </div>
  );
};
