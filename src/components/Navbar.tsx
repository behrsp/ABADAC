import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, FontOption, AccentOption } from '../context/ThemeContext';
import { AbadaLogo } from './AbadaLogo';
import {
  Music,
  Video,
  Image,
  CalendarDays,
  Cake,
  Bell,
  MessageSquare,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  Award,
  Type,
  Palette,
  Check,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenGraduationModal: () => void;
  onOpenAuthModal: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenGraduationModal,
  onOpenAuthModal,
  unreadCount = 0
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { font, accent, setFont, setAccent, getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'aulas', label: 'Aulas', icon: GraduationCap },
    { id: 'videos', label: 'Vídeos', icon: Video },
    { id: 'fotos', label: 'Fotos', icon: Image },
    { id: 'recados', label: 'Recados', icon: Bell },
    { id: 'eventos', label: 'Eventos', icon: CalendarDays },
    { id: 'aniversariantes', label: 'Aniversariantes', icon: Cake },
    { id: 'chat', label: 'Falar com ADM', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  const fontOptions: { id: FontOption; label: string; desc: string }[] = [
    { id: 'jakarta', label: 'Plus Jakarta', desc: 'Moderna & Equilibrada' },
    { id: 'cinzel', label: 'Cinzel Serif', desc: 'Nobre & Tradicional' },
    { id: 'mono', label: 'JetBrains Mono', desc: 'Rítmica & Técnica' },
    { id: 'sans', label: 'Inter Sans', desc: 'Minimalista & Rápida' },
  ];

  const accentOptions: { id: AccentOption; name: string; color: string }[] = [
    { id: 'gold', name: 'Ouro Abadá', color: '#F59E0B' },
    { id: 'red', name: 'Rubi Mestre', color: '#EF4444' },
    { id: 'green', name: 'Floresta Instrutor', color: '#10B981' },
    { id: 'blue', name: 'Mar Graduado', color: '#3B82F6' },
    { id: 'purple', name: 'Ametista Professor', color: '#8B5CF6' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('musicas')}
          className="cursor-pointer transition hover:opacity-90 shrink-0"
        >
          <AbadaLogo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-zinc-800/90 text-white shadow-xs border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? accentClasses.primaryText : 'text-zinc-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons: Graduações, Font/Theme Selector, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sistema de Graduação Button */}
          <button
            onClick={onOpenGraduationModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition shadow-xs"
            title="Ver Sistema de Graduação Oficial ABADÁ"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Graduações</span>
          </button>

          {/* Theme & Font Customization Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1"
              title="Personalizar Tipografia e Cor"
            >
              <Type className="w-4 h-4 text-amber-400" />
              <Palette className="w-3 h-3 text-zinc-500" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-amber-400" />
                    Escolher Tipografia (Fonte)
                  </h4>
                  <button
                    onClick={() => setShowThemeMenu(false)}
                    className="text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Fonts */}
                <div className="space-y-1.5 mb-4">
                  {fontOptions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                        font === f.id
                          ? 'bg-zinc-800 text-white border border-amber-500/40'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{f.label}</div>
                        <div className="text-[10px] text-zinc-500">{f.desc}</div>
                      </div>
                      {font === f.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>

                {/* Accent Colors */}
                <div className="pt-3 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    Tom de Destaque
                  </h4>
                  <div className="flex items-center justify-between gap-1.5">
                    {accentOptions.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAccent(a.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                          accent === a.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: a.color }}
                        title={a.name}
                      >
                        {accent === a.id && <Check className="w-3.5 h-3.5 text-black font-black" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Dashboard Quick Link (Visible if Admin) */}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                currentTab === 'admin'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 border-amber-500/40 text-amber-300 hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Painel Admin</span>
            </button>
          )}

          {/* User Profile / Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-black font-black text-xs">
                  {user.apelido ? user.apelido.charAt(0).toUpperCase() : user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-none">
                    {user.apelido || user.name || user.phone}
                  </div>
                  <div className="text-[10px] text-amber-400/90 leading-tight">
                    {user.role === 'admin' ? 'Administrador' : user.corda || 'Aluno'}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50">
                  <div className="p-3 border-b border-zinc-800">
                    <p className="text-xs font-semibold text-white">{user.name || 'Aluno ABADÁ'}</p>
                    <p className="text-[11px] text-amber-400 font-medium">{user.apelido ? `"${user.apelido}"` : user.phone}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{user.corda || 'Corda Crua'}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('perfil');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl flex items-center gap-2 transition"
                  >
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                    Meu Perfil de Aluno
                  </button>

                  <button
                    onClick={() => {
                      onOpenGraduationModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl flex items-center gap-2 transition"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    Sistema de Graduação
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        onSelectTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl flex items-center gap-2 transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Gerenciar Alunos & App
                    </button>
                  )}

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/40 rounded-xl flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className={`px-4 py-2 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs flex items-center gap-1.5 shadow-lg hover:brightness-110 transition`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
