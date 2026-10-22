import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CORDAS_LIST } from '../data/abadaGraduations';
import {
  ShieldCheck,
  Users,
  Music,
  Video,
  Image,
  CalendarDays,
  Search,
  UserCheck,
  UserX,
  ShieldAlert,
  Edit3,
  Trash2,
  Database,
  Lock,
  Phone,
  Cake,
  Award,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminDashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateToTab }) => {
  const { user, isOwner } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'aluno' | 'admin'>('todos');

  // Edit Student Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editApelido, setEditApelido] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCorda, setEditCorda] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'aluno'>('aluno');
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.getAllUsers(),
        api.getStats()
      ]);
      setUsers(uRes.users);
      setStats(sRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRole = async (targetUser: User) => {
    const isCurrentlyAdmin = targetUser.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'aluno' : 'admin';

    if (targetUser.phone === '41984842941') {
      return;
    }

    const actionText = isCurrentlyAdmin
      ? `Remover os privilégios de administrador de ${targetUser.name || targetUser.phone}? O usuário voltará a ser aluno.`
      : `Promover ${targetUser.name || targetUser.phone} a Administrador com acesso ao painel de manutenção e uploads?`;

    setConfirmModalData({
      isOpen: true,
      title: isCurrentlyAdmin ? 'Remover Privilégio' : 'Promover a Administrador',
      message: actionText,
      confirmLabel: isCurrentlyAdmin ? 'Confirmar Rebaixamento' : 'Promover Aluno',
      isDestructive: isCurrentlyAdmin,
      onConfirm: async () => {
        try {
          await api.updateUserRole(targetUser.phone, newRole);
          setUsers(prev => prev.map(u => u.phone === targetUser.phone ? { ...u, role: newRole } : u));
        } catch (err: any) {
          console.error(err);
        } finally {
          setConfirmModalData(null);
        }
      }
    });
  };

  const handleToggleBlock = (targetUser: User) => {
    if (targetUser.phone === '41984842941') {
      return;
    }

    const newBlocked = !targetUser.is_blocked;
    const actionText = newBlocked
      ? `Bloquear o acesso de ${targetUser.name || targetUser.phone}? O aluno não conseguirá fazer login.`
      : `Desbloquear o acesso de ${targetUser.name || targetUser.phone}? O aluno poderá acessar o app novamente.`;

    setConfirmModalData({
      isOpen: true,
      title: newBlocked ? 'Bloquear Aluno' : 'Desbloquear Aluno',
      message: actionText,
      confirmLabel: newBlocked ? 'Sim, Bloquear' : 'Desbloquear Aluno',
      isDestructive: newBlocked,
      onConfirm: async () => {
        try {
          await api.toggleBlockUser(targetUser.phone, newBlocked);
          setUsers(prev => prev.map(u => u.phone === targetUser.phone ? { ...u, is_blocked: newBlocked } : u));
        } catch (err: any) {
          console.error(err);
        } finally {
          setConfirmModalData(null);
        }
      }
    });
  };

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser.phone === '41984842941') {
      return;
    }

    setConfirmModalData({
      isOpen: true,
      title: 'Excluir Aluno Permanentemente',
      message: `Tem certeza que deseja excluir permanentemente o cadastro de ${targetUser.name || targetUser.phone}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Sim, Excluir Cadastro',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.deleteUser(targetUser.phone);
          setUsers(prev => prev.filter(u => u.phone !== targetUser.phone));
        } catch (err: any) {
          console.error(err);
        } finally {
          setConfirmModalData(null);
        }
      }
    });
  };

  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditName(targetUser.name || '');
    setEditApelido(targetUser.apelido || '');
    setEditPhone(targetUser.phone || '');
    setEditPassword('');
    setEditBirthDate(targetUser.birth_date || '');
    setEditCorda(targetUser.corda || 'Corda Crua');
    setEditRole(targetUser.role || 'aluno');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      await api.editUser(editingUser.phone, {
        name: editName,
        apelido: editApelido,
        birth_date: editBirthDate,
        corda: editCorda,
        role: editRole,
        password: editPassword || undefined,
        new_phone: editPhone !== editingUser.phone ? editPhone : undefined
      });

      setEditingUser(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.apelido && u.apelido.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search)) ||
      (u.corda && u.corda.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Painel Administrativo
              </span>
              <span className="text-xs text-zinc-400">
                {isOwner ? '👑 Proprietário Geral (41984842941)' : 'Auxiliar de Manutenção'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Gestão de Alunos & Controle da Escola
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl">
              Gerencie cadastros, graduações, promova novos administradores para auxiliar na manutenção do app, faça bloqueios ou edições completas.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-bold self-start md:self-center"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Atualizar Dados
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Alunos</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Músicas</span>
              <Music className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalSongs}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Aulas (Vídeo)</span>
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalLessons || 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Vídeos</span>
              <Video className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalVideos}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Fotos</span>
              <Image className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalPhotos}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Eventos</span>
              <CalendarDays className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats.totalEvents}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-xs">Banco</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-emerald-400 truncate mt-2">
              Neon DB
            </p>
          </div>
        </div>
      )}

      {/* Quick Navigation to Sections */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-zinc-400 font-semibold">Atalhos de Conteúdo:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateToTab('aulas')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-semibold transition flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            + Postar Aula (Upload)
          </button>
          <button
            onClick={() => onNavigateToTab('musicas')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            + Upload de Músicas
          </button>
          <button
            onClick={() => onNavigateToTab('videos')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            + Adicionar Vídeos
          </button>
          <button
            onClick={() => onNavigateToTab('fotos')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            + Postar Fotos
          </button>
          <button
            onClick={() => onNavigateToTab('recados')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            + Publicar Comunicado
          </button>
          <button
            onClick={() => onNavigateToTab('eventos')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
          >
            + Criar Evento
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
          <button
            onClick={() => setRoleFilter('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              roleFilter === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('aluno')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              roleFilter === 'aluno' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Alunos ({users.filter(u => u.role === 'aluno').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              roleFilter === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Administradores ({users.filter(u => u.role === 'admin').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, apelido, celular ou corda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Aluno / Membro</th>
                <th className="py-4 px-4">Celular</th>
                <th className="py-4 px-4">Graduação</th>
                <th className="py-4 px-4">Aniversário</th>
                <th className="py-4 px-4">Cargo</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 sm:px-6 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Carregando tabela de alunos...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    Nenhum aluno encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((member) => {
                  const isMainOwner = member.phone === '41984842941';

                  return (
                    <tr
                      key={member.phone}
                      className="hover:bg-zinc-900/40 transition"
                    >
                      {/* Name & Apelido */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                            {member.name ? member.name.charAt(0) : 'A'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {member.name || 'Aluno Cadastrado'}
                            </span>
                            {member.apelido ? (
                              <span className="text-[11px] text-amber-400 font-semibold truncate block">
                                "{member.apelido}"
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-600 block">Sem apelido</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {member.phone}
                      </td>

                      {/* Corda */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
                          {member.corda || 'Corda Crua'}
                        </span>
                      </td>

                      {/* Birthday */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        {member.birth_date ? (
                          <div className="flex items-center gap-1.5">
                            <Cake className="w-3.5 h-3.5 text-pink-400" />
                            <span>{member.birth_date}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">Não informado</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            {isMainOwner ? 'Proprietário' : 'Administrador'}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                            Aluno
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {member.is_blocked ? (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Promote/Demote Admin */}
                          {!isMainOwner && (
                            <button
                              onClick={() => handleToggleRole(member)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                                member.role === 'admin'
                                  ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                              }`}
                              title={member.role === 'admin' ? 'Tirar privilégio de ADM' : 'Promover a Administrador auxiliar'}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Block/Unblock */}
                          {!isMainOwner && (
                            <button
                              onClick={() => handleToggleBlock(member)}
                              className={`p-1.5 rounded-lg border transition ${
                                member.is_blocked
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400'
                              }`}
                              title={member.is_blocked ? 'Desbloquear Aluno' : 'Bloquear Acesso'}
                            >
                              {member.is_blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Edit Full Details */}
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                            title="Editar Dados do Aluno"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          {!isMainOwner && (
                            <button
                              onClick={() => handleDeleteUser(member)}
                              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                              title="Excluir Aluno"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              Editar Informações do Aluno
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              O Administrador pode alterar qualquer dado cadastrado.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Apelido na Capoeira</label>
                  <input
                    type="text"
                    value={editApelido}
                    onChange={(e) => setEditApelido(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Celular / WhatsApp</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nova Senha (opcional)</label>
                  <input
                    type="password"
                    placeholder="Manter a atual"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Data de Aniversário</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Corda Atual</label>
                  <select
                    value={editCorda}
                    onChange={(e) => setEditCorda(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {CORDAS_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Privilégio no App</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'aluno')}
                  disabled={editingUser.phone === '41984842941'}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="aluno">Aluno (Somente ver, ouvir e baixar)</option>
                  <option value="admin">Administrador (Pode fazer uploads e gerenciar)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`px-5 py-2.5 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs disabled:opacity-50`}
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmLabel={confirmModalData.confirmLabel}
          isDestructive={confirmModalData.isDestructive}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  );
};
