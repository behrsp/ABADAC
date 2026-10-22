import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';
import {
  Cake,
  Calendar,
  Sparkles,
  MessageSquare,
  Award,
  ChevronLeft,
  ChevronRight,
  PartyPopper
} from 'lucide-react';

interface BirthdaysViewProps {
  onStartChatWithUser?: (userPhone: string) => void;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({ onStartChatWithUser }) => {
  const { user } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const currentRealMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [birthdayUsers, setBirthdayUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const fetchBirthdays = async (monthNum: number) => {
    setLoading(true);
    try {
      const res = await api.getBirthdays(monthNum);
      setBirthdayUsers(res.users);

      // Trigger celebratory confetti if viewing current month and there are birthdays
      if (monthNum === currentRealMonth && res.users.length > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays(selectedMonth);
  }, [selectedMonth]);

  const getDayOfBirth = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      return parts[2] ? parseInt(parts[2]) : '';
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      return parts[0] ? parseInt(parts[0]) : '';
    }
    return '';
  };

  const isToday = (dateStr?: string) => {
    if (!dateStr || selectedMonth !== currentRealMonth) return false;
    const day = getDayOfBirth(dateStr);
    return day === currentDay;
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/30">
                Celebração da Roda
              </span>
              <span className="text-xs text-zinc-400">• Lista Automatizada</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Aniversariantes de {monthNames[selectedMonth - 1]}
              <PartyPopper className="w-7 h-7 text-amber-400 inline" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Celebramos o ciclo de vida dos nossos capoeiristas. Deixe uma mensagem carinhosa e celebre mais um ano de axé e mandinga na roda!
            </p>
          </div>

          {/* Month Selector Buttons */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1.5 self-start md:self-center">
            <button
              onClick={() => setSelectedMonth(prev => (prev === 1 ? 12 : prev - 1))}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-amber-400 px-3 min-w-[100px] text-center">
              {monthNames[selectedMonth - 1]}
            </span>
            <button
              onClick={() => setSelectedMonth(prev => (prev === 12 ? 1 : prev + 1))}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Birthdays List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Buscando aniversariantes do mês...</div>
      ) : birthdayUsers.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <Cake className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Nenhum aniversariante cadastrado em {monthNames[selectedMonth - 1]}</p>
          <p className="text-xs text-zinc-400 mt-1">Os alunos podem preencher a data de aniversário no cadastro ou no perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {birthdayUsers.map((member) => {
            const day = getDayOfBirth(member.birth_date);
            const todayBirthday = isToday(member.birth_date);

            return (
              <div
                key={member.id}
                className={`p-5 rounded-3xl border transition relative flex flex-col justify-between overflow-hidden ${
                  todayBirthday
                    ? 'bg-linear-to-b from-amber-950/40 via-zinc-950 to-black border-amber-500/80 shadow-xl shadow-amber-500/10'
                    : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {todayBirthday && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">
                    Aniversário Hoje! 🎉
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    {/* Day badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border font-black ${
                      todayBirthday
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                    }`}>
                      <span className="text-[10px] leading-none uppercase font-semibold text-zinc-400">Dia</span>
                      <span className="text-base leading-tight font-black">{day || '--'}</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base truncate">
                        {member.name || member.apelido || 'Capoeirista'}
                      </h3>
                      {member.apelido && (
                        <p className="text-xs text-amber-400 font-semibold truncate">
                          "{member.apelido}"
                        </p>
                      )}
                      <span className="text-[11px] text-zinc-500 block truncate">
                        {member.corda || 'Corda Crua'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px]">
                    {member.role === 'admin' ? 'Administrador' : 'Aluno da Roda'}
                  </span>

                  {onStartChatWithUser && (
                    <button
                      onClick={() => onStartChatWithUser(member.phone)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 font-semibold flex items-center gap-1.5 transition text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Parabenizar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
