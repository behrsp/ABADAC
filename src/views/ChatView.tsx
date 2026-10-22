import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  ShieldCheck,
  Clock,
  CheckCheck,
  Search,
  Sparkles,
  PhoneCall,
  RefreshCw
} from 'lucide-react';

interface ChatViewProps {
  initialTargetPhone?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ initialTargetPhone }) => {
  const { user, isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  // Student view state: list of admins to choose from
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  // Admin view state: list of student threads
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedStudentPhone, setSelectedStudentPhone] = useState<string | null>(initialTargetPhone || null);
  const [selectedStudentUser, setSelectedStudentUser] = useState<User | null>(null);

  // Shared chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch initial admins (for students)
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const res = await api.getAdmins();
        setAdmins(res.admins);
        if (res.admins.length > 0 && !selectedAdmin && !isAdmin) {
          // default to first admin (usually owner 41984842941)
          setSelectedAdmin(res.admins[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAdmins();
  }, [isAdmin]);

  // Fetch admin threads (for administrators)
  const fetchThreads = async () => {
    if (!user || !isAdmin) return;
    try {
      const res = await api.getAdminThreads(user.phone);
      setThreads(res.threads);

      // If initial target phone specified, select it
      if (initialTargetPhone && !selectedStudentPhone) {
        setSelectedStudentPhone(initialTargetPhone);
        const match = res.threads.find((t: any) => t.student.phone === initialTargetPhone);
        if (match) setSelectedStudentUser(match.student);
      } else if (!selectedStudentPhone && res.threads.length > 0) {
        setSelectedStudentPhone(res.threads[0].student.phone);
        setSelectedStudentUser(res.threads[0].student);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchThreads();
    }
  }, [isAdmin, user?.phone]);

  // Poll messages every 3 seconds for real-time conversation sync
  useEffect(() => {
    if (!user) return;

    let targetPhone = '';
    if (isAdmin) {
      if (!selectedStudentPhone) return;
      targetPhone = selectedStudentPhone;
    } else {
      if (!selectedAdmin) return;
      targetPhone = selectedAdmin.phone;
    }

    const loadMessages = async () => {
      try {
        const res = await api.getMessages(user.phone, targetPhone);
        setMessages(res.messages);
        // Mark as read
        await api.markAsRead(user.phone, targetPhone);
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [user?.phone, selectedAdmin?.phone, selectedStudentPhone, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login com seu celular para enviar mensagens aos administradores.');
      return;
    }
    if (!inputText.trim()) return;

    let recipientPhone = '';
    if (isAdmin) {
      if (!selectedStudentPhone) return;
      recipientPhone = selectedStudentPhone;
    } else {
      if (!selectedAdmin) return;
      recipientPhone = selectedAdmin.phone;
    }

    setSending(true);
    try {
      const senderName = user.apelido
        ? `${user.name || 'Usuário'} (${user.apelido})`
        : user.name || user.phone;

      const res = await api.sendMessage(user.phone, senderName, recipientPhone, inputText.trim());
      setMessages(prev => [...prev, res.message]);
      setInputText('');
      if (isAdmin) fetchThreads();
      scrollToBottom();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg mx-auto">
        <MessageSquare className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Chat Interno com Administradores</h3>
        <p className="text-xs text-zinc-400 mt-2">
          Entre com seu celular e senha para falar diretamente com o Mestre Proprietário ou com os monitores e auxiliares da escola.
        </p>
      </div>
    );
  }

  // Active chat partner header info
  const currentChatName = isAdmin
    ? selectedStudentUser?.name || selectedStudentUser?.apelido || selectedStudentPhone || 'Aluno'
    : selectedAdmin?.name || 'Administrador Geral';

  const currentChatSub = isAdmin
    ? `Aluno • Cel: ${selectedStudentPhone || ''} • ${selectedStudentUser?.corda || 'Corda Crua'}`
    : `Administrador • ${selectedAdmin?.corda || 'ABADÁ'}`;

  return (
    <div className="space-y-4 pb-28">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Canal Direto
              </span>
              <span className="text-xs text-zinc-400">• Sincronização em Tempo Real</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white mt-1">
              {isAdmin ? 'Central de Mensagens dos Alunos' : 'Falar com os Administradores'}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] shadow-2xl">
        {/* Left Column: List of Admins (for student) OR List of Student Threads (for admin) */}
        <div className="md:col-span-4 border-r border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {isAdmin ? 'Conversas dos Alunos' : 'Escolha o Administrador'}
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">
                {isAdmin ? `${threads.length} alunos` : `${admins.length} ADMs disponíveis`}
              </span>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {!isAdmin ? (
                // Student choosing which admin to message
                admins.map((adm) => {
                  const isSelected = selectedAdmin?.phone === adm.phone;
                  const isOwner = adm.phone === '41984842941';

                  return (
                    <button
                      key={adm.phone}
                      onClick={() => setSelectedAdmin(adm)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-zinc-900 border-amber-500/50 shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/70 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                            {adm.name || 'Administrador'}
                          </h4>
                          {isOwner && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                              Proprietário
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {adm.apelido ? `"${adm.apelido}"` : adm.phone}
                        </p>
                        <span className="text-[10px] text-zinc-500">
                          {adm.corda || 'Mestria'}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                // Admin viewing students
                threads.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 text-xs">
                    Nenhuma mensagem recebida ainda.
                  </div>
                ) : (
                  threads.map((thread) => {
                    const isSelected = selectedStudentPhone === thread.student.phone;
                    return (
                      <button
                        key={thread.student.phone}
                        onClick={() => {
                          setSelectedStudentPhone(thread.student.phone);
                          setSelectedStudentUser(thread.student);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-zinc-900 border-amber-500/50 shadow-md'
                            : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 font-bold text-xs">
                            {thread.student.name ? thread.student.name.charAt(0) : 'A'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">
                              {thread.student.name || thread.student.phone}
                            </h4>
                            {thread.student.apelido && (
                              <p className="text-[10px] text-amber-400 truncate">
                                "{thread.student.apelido}"
                              </p>
                            )}
                            {thread.last_message && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                                {thread.last_message.text}
                              </p>
                            )}
                          </div>
                        </div>

                        {thread.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {thread.unread_count}
                          </span>
                        )}
                      </button>
                    );
                  })
                )
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Respostas instantâneas e seguras</span>
          </div>
        </div>

        {/* Right Column: Chat Conversation */}
        <div className="md:col-span-8 flex flex-col justify-between bg-black/40">
          {/* Header of Active Chat */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-600 to-yellow-400 text-black flex items-center justify-center font-black">
                {currentChatName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {currentChatName}
                </h3>
                <p className="text-xs text-zinc-400">
                  {currentChatSub}
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[420px]">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-zinc-600 text-xs">
                Inicie a conversa! Envie suas dúvidas sobre graduação, treinos ou eventos.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_phone === user.phone;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-zinc-500 mb-0.5 px-1">
                      {isMe ? 'Você' : msg.sender_name}
                    </span>
                    <div
                      className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? `${accentClasses.primaryBg} text-black font-medium shadow-md rounded-br-none`
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-zinc-600 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Escreva sua mensagem para ${currentChatName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className={`p-3 rounded-2xl ${accentClasses.primaryBg} text-black font-bold shadow-lg hover:brightness-110 disabled:opacity-40 transition`}
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
