import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ABADA_GRADUATIONS, CORDAS_LIST } from '../data/abadaGraduations';
import {
  User as UserIcon,
  Award,
  Calendar,
  Lock,
  Phone,
  Save,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface StudentProfileViewProps {
  onOpenGraduationModal: () => void;
  onNavigateToMusicTab: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onOpenGraduationModal,
  onNavigateToMusicTab
}) => {
  const { user, updateUser, isOwner, isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [name, setName] = useState(user?.name || '');
  const [apelido, setApelido] = useState(user?.apelido || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '');
  const [corda, setCorda] = useState(user?.corda || 'Corda Crua');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md mx-auto">
        <UserIcon className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Área do Aluno</h3>
        <p className="text-xs text-zinc-400 mt-2">
          Faça login para visualizar e editar seus dados, apelido na capoeira e corda.
        </p>
      </div>
    );
  }

  // Find graduation stage
  const currentGradIndex = ABADA_GRADUATIONS.findIndex(
    g => g.name.toLowerCase() === (user.corda || 'Corda Crua').toLowerCase()
  );
  const currentGrad = currentGradIndex !== -1 ? ABADA_GRADUATIONS[currentGradIndex] : ABADA_GRADUATIONS[0];
  const nextGrad = currentGradIndex !== -1 && currentGradIndex < ABADA_GRADUATIONS.length - 1
    ? ABADA_GRADUATIONS[currentGradIndex + 1]
    : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateUser({
        name,
        apelido,
        birth_date: birthDate,
        corda,
        password: password || undefined
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-zinc-900 via-zinc-950 to-black border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-amber-600 via-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shadow-amber-500/10">
              {user.apelido ? user.apelido.charAt(0).toUpperCase() : user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {isAdmin ? 'Membro da Equipe / ADM' : 'Aluno Oficial'}
                </span>
                {isOwner && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    Proprietário
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white">
                {user.name || 'Aluno ABADÁ'} {user.apelido ? `(${user.apelido})` : ''}
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Celular de Login: {user.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenGraduationModal}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-2 transition self-start md:self-center shadow-xs"
          >
            <Award className="w-4 h-4 text-amber-400" />
            Sistema de Graduação ABADÁ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Edit Form */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-amber-400" />
                Seus Dados Cadastrais
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Você pode alterar seu apelido, nome, corda e dados a qualquer momento.
              </p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Salvo!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome oficial"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Apelido na Capoeira</label>
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Ex: Gafanhoto, Sereia..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Data de Aniversário</label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Sua Corda Atual na ABADÁ-Capoeira
              </label>
              <div className="relative">
                <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={corda}
                  onChange={(e) => setCorda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {CORDAS_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Alterar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a senha atual"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* Graduation Evolution Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Sua Graduação Atual
                </span>
                <span className="text-[11px] text-zinc-500">
                  Estágio #{currentGrad.level}
                </span>
              </div>

              {/* Corda Visual Banner */}
              <div className="p-4 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-white">{currentGrad.name}</h4>
                  <span className="text-xs text-amber-400 font-semibold">{currentGrad.title}</span>
                </div>
                <div className="w-20 h-5 rounded-full overflow-hidden border border-zinc-600 flex shadow-inner">
                  <div className="h-full flex-1" style={{ backgroundColor: currentGrad.colorLeft }} />
                  {currentGrad.colorRight && (
                    <div className="h-full flex-1 border-l border-black/40" style={{ backgroundColor: currentGrad.colorRight }} />
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Símbolo</span>
                  <span className="text-zinc-200 font-medium">{currentGrad.symbol}</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Filosofia</span>
                  <span className="text-zinc-300 leading-relaxed">{currentGrad.meaning}</span>
                </div>
              </div>

              {/* Next Corda Projection */}
              {nextGrad && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-semibold">Próximo Objetivo</span>
                    <span className="text-xs font-bold text-white">{nextGrad.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>

            <button
              onClick={onOpenGraduationModal}
              className="mt-6 w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-amber-300 font-semibold transition"
            >
              Ver Todas as 17 Graduações da ABADÁ
            </button>
          </div>

          {/* Quick link to music favorites */}
          <div
            onClick={onNavigateToMusicTab}
            className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <h4 className="text-sm font-bold text-white">Minhas Músicas & Playlists</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Acesse seus áudios favoritados para a roda</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
