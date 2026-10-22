import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Music,
  GraduationCap,
  Video,
  Image,
  CalendarDays,
  Bell,
  MessageSquare,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, unreadCount = 0 }) => {
  const { isAdmin } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const items = [
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'aulas', label: 'Aulas', icon: GraduationCap },
    { id: 'videos', label: 'Vídeos', icon: Video },
    { id: 'recados', label: 'Mural', icon: Bell },
    { id: 'eventos', label: 'Eventos', icon: CalendarDays },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: unreadCount },
    isAdmin
      ? { id: 'admin', label: 'Admin', icon: ShieldCheck }
      : { id: 'perfil', label: 'Perfil', icon: UserIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? accentClasses.primaryText : ''}`} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-zinc-100 font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
