import React, { useState, useEffect } from 'react';
import { EventItem, RsvpStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  CalendarPlus,
  Star,
  MessageCircle,
  Plus,
  Trash2,
  X,
  Share2,
  Users
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const EventsView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEventForComments, setSelectedEventForComments] = useState<EventItem | null>(null);

  // New Event Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('Academia Central ABADÁ');
  const [submitting, setSubmitting] = useState(false);

  // New Comment Form
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commenting, setCommenting] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents(user?.phone);
      setEvents(res.events);
      if (selectedEventForComments) {
        const updated = res.events.find(e => e.id === selectedEventForComments.id);
        if (updated) setSelectedEventForComments(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user?.phone]);

  const handleRsvp = async (event: EventItem, status: RsvpStatus) => {
    if (!user) {
      alert('Faça login com seu celular para confirmar presença no evento.');
      return;
    }

    try {
      await api.setRsvp(
        event.id,
        user.phone,
        status,
        user.name || 'Aluno ABADÁ',
        user.apelido || ''
      );
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para avaliar e comentar.');
      return;
    }
    if (!selectedEventForComments || !commentText.trim()) return;

    setCommenting(true);
    try {
      await api.addComment(
        selectedEventForComments.id,
        user.phone,
        user.name || user.phone,
        user.apelido || '',
        commentText.trim(),
        commentRating
      );
      setCommentText('');
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommenting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setSubmitting(true);
    try {
      await api.createEvent({
        title,
        description,
        date,
        time,
        location
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('19:00');
      setLocation('Academia Central ABADÁ');
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (event: EventItem) => {
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await api.deleteEvent(eventToDelete.id);
      setEvents(prev => prev.filter(e => String(e.id) !== String(eventToDelete.id)));
      if (selectedEventForComments && String(selectedEventForComments.id) === String(eventToDelete.id)) {
        setSelectedEventForComments(null);
      }
    } catch (err: any) {
      console.error('Erro ao excluir evento:', err);
    } finally {
      setEventToDelete(null);
    }
  };

  // Sync with External Calendars
  const downloadIcs = (event: EventItem) => {
    const startDate = event.date.replace(/-/g, '') + 'T' + (event.time ? event.time.replace(/:/g, '') + '00' : '190000');
    const endDate = event.date.replace(/-/g, '') + 'T' + (event.time ? (parseInt(event.time.split(':')[0]) + 2).toString().padStart(2, '0') + event.time.split(':')[1] + '00' : '210000');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ABADA Capoeira//Event Calendar//PT',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Evento oficial ABADÁ-Capoeira'}`,
      `LOCATION:${event.location || 'Academia ABADÁ'}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getGoogleCalendarUrl = (event: EventItem) => {
    const startDate = event.date.replace(/-/g, '') + 'T' + (event.time ? event.time.replace(/:/g, '') + '00' : '190000');
    const endDate = event.date.replace(/-/g, '') + 'T' + (event.time ? (parseInt(event.time.split(':')[0]) + 2).toString().padStart(2, '0') + event.time.split(':')[1] + '00' : '210000');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || 'Evento oficial ABADÁ-Capoeira',
      location: event.location || 'Academia ABADÁ'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Agenda Oficial
              </span>
              <span className="text-xs text-zinc-400">• Confirmação de Presença</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Eventos, Batizados & Rodas
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Confirme sua presença com opções Vou, Não Vou ou Talvez, sincronize diretamente com seu Google Calendar ou Apple Calendar e deixe sua avaliação.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black text-xs font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition`}
            >
              <Plus className="w-4 h-4" />
              Criar Novo Evento (ADM)
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Carregando calendário de eventos...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <CalendarDays className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhum evento agendado no momento</p>
          <p className="text-xs text-zinc-400 mt-1">Fique atento aos recados para as próximas programações.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((event) => {
            const myRsvp = event.my_rsvp;
            const commentsCount = event.comments?.length || 0;
            const avgRating = commentsCount > 0
              ? (event.comments!.reduce((acc, c) => acc + c.rating, 0) / commentsCount).toFixed(1)
              : null;

            return (
              <div
                key={event.id}
                className="p-5 sm:p-7 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Event Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Date Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                      <CalendarDays className="w-4 h-4" />
                      <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {event.time && (
                      <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{event.time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate max-w-xs">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-2xl font-black text-white">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                      {event.description}
                    </p>
                  )}

                  {/* Attendance Stats & Comments indicator */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {event.counts?.vou || 0} Confirmados
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {event.counts?.talvez || 0} Talvez
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        {event.counts?.nao_vou || 0} Não vão
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedEventForComments(event)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition underline font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{commentsCount} comentários</span>
                      {avgRating && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold ml-1">
                          <Star className="w-3 h-3 fill-current" />
                          {avgRating}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right side: RSVP Options & Calendar Export */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  {/* RSVP buttons */}
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <button
                      onClick={() => handleRsvp(event, 'vou')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        myRsvp === 'vou'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-emerald-400'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Vou
                    </button>
                    <button
                      onClick={() => handleRsvp(event, 'talvez')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        myRsvp === 'talvez'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-amber-400'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Talvez
                    </button>
                    <button
                      onClick={() => handleRsvp(event, 'nao_vou')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        myRsvp === 'nao_vou'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-red-400'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Não Vou
                    </button>
                  </div>

                  {/* Sync External Calendar */}
                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleCalendarUrl(event)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      title="Adicionar ao Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                      Google Calendar
                    </a>

                    <button
                      onClick={() => downloadIcs(event)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Baixar arquivo .ICS para Apple Calendar / Outlook"
                    >
                      .ICS
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-red-400 transition"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Comments & Reviews Modal */}
      {selectedEventForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedEventForComments(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs text-amber-400 font-semibold">Avaliações & Comentários</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{selectedEventForComments.title}</h3>
            </div>

            {/* Existing Comments */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {(!selectedEventForComments.comments || selectedEventForComments.comments.length === 0) ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Seja o primeiro a avaliar ou comentar sobre este evento!
                </div>
              ) : (
                selectedEventForComments.comments.map((comm) => (
                  <div key={comm.id} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{comm.user_name}</span>
                        {comm.user_apelido && (
                          <span className="text-[11px] text-amber-400">"{comm.user_apelido}"</span>
                        )}
                      </div>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: comm.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{comm.comment}</p>
                    <span className="text-[10px] text-zinc-600 block">
                      {comm.created_at ? new Date(comm.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Leave a Comment */}
            {user ? (
              <form onSubmit={handleAddComment} className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-semibold">Sua Avaliação:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setCommentRating(star)}
                        className="p-1 text-zinc-600 hover:text-amber-400 transition"
                      >
                        <Star className={`w-4 h-4 ${star <= commentRating ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Deixe uma mensagem sobre o evento, energia ou expectativas..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={commenting}
                    className={`px-4 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs disabled:opacity-50`}
                  >
                    Enviar
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                Faça login para enviar seu comentário sobre o evento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Create Event Modal */}
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
              <CalendarDays className="w-5 h-5 text-amber-400" />
              Criar Novo Evento (ADM)
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título do Evento <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Batizado & Troca de Cordas 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Data do Evento <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Horário</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Localização</label>
                <input
                  type="text"
                  placeholder="Ex: Academia Central ABADÁ - Rua das Palmeiras, 100"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">Descrição do Evento</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para os alunos, uniformes, taxas e horários das baterias..."
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
                  {submitting ? 'Criando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${eventToDelete?.title}" da agenda?`}
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
