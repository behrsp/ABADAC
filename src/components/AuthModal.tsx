import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CORDAS_LIST } from '../data/abadaGraduations';
import { X, Phone, Lock, User as UserIcon, Calendar, Award, Sparkles, AlertCircle } from 'lucide-react';
import { AbadaLogo } from './AbadaLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register non-mandatory fields
  const [name, setName] = useState('');
  const [apelido, setApelido] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [corda, setCorda] = useState('Corda Crua');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(phone, password);
      } else {
        await register({
          phone,
          password,
          name: name.trim() || undefined,
          apelido: apelido.trim() || undefined,
          birth_date: birthDate || undefined,
          corda: corda || 'Corda Crua'
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro na operação');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickFill = () => {
    setPhone('41984842941');
    setPassword('235689');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <AbadaLogo size="lg" showText={false} className="mb-2" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'login' ? 'Entrar no Portal ABADÁ' : 'Novo Aluno ABADÁ'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            {mode === 'login'
              ? 'Acesse com seu celular e senha sem complicação'
              : 'Cadastre-se com celular e senha. Dados extras são opcionais.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone (Celular) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Celular / WhatsApp <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="tel"
                placeholder="(41) 98484-2941"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Password (Senha) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Senha de sua preferência <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                placeholder="Sua senha simples"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Optional fields for Student Registration */}
          {mode === 'register' && (
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Campos Opcionais do Aluno</span>
                <span className="text-[10px] text-zinc-500">Pode preencher depois</span>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Apelido na Roda</label>
                  <input
                    type="text"
                    placeholder="Ex: Gafanhoto"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Aniversário</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Corda Atual na ABADÁ</label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={corda}
                    onChange={(e) => setCorda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {CORDAS_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-sm shadow-lg hover:brightness-110 transition disabled:opacity-50`}
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Concluir Cadastro'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-5 text-center text-xs text-zinc-400">
          {mode === 'login' ? (
            <p>
              Não possui cadastro?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-amber-400 font-semibold hover:underline"
              >
                Cadastre-se aqui
              </button>
            </p>
          ) : (
            <p>
              Já tem conta cadastrada?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-amber-400 font-semibold hover:underline"
              >
                Faça login
              </button>
            </p>
          )}
        </div>

        {/* Quick Admin Access helper for the owner 41984842941 / 235689 */}
        <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
          <button
            onClick={handleAdminQuickFill}
            className="text-[11px] text-zinc-500 hover:text-amber-400 transition flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            Preencher Login Proprietário (41984842941)
          </button>
          <span className="text-[10px] text-zinc-600">ABADÁ-Capoeira v2.6</span>
        </div>
      </div>
    </div>
  );
};
