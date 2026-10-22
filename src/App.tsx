import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { GraduationModal } from './components/GraduationModal';
import { AuthModal } from './components/AuthModal';

import { MusicView } from './views/MusicView';
import { ClassesView } from './views/ClassesView';
import { VideosView } from './views/VideosView';
import { PhotosView } from './views/PhotosView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { EventsView } from './views/EventsView';
import { BirthdaysView } from './views/BirthdaysView';
import { ChatView } from './views/ChatView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { StudentProfileView } from './views/StudentProfileView';

import { api } from './services/api';

const MainContent: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('musicas');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
  const [chatTargetPhone, setChatTargetPhone] = useState<string | undefined>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check unread messages for admin or student
  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        if (isAdmin) {
          const res = await api.getAdminThreads(user.phone);
          const totalUnread = res.threads.reduce((acc: number, t: any) => acc + (t.unread_count || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (e) {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [user?.phone, isAdmin]);

  const handleStartChatWithUser = (targetPhone: string) => {
    setChatTargetPhone(targetPhone);
    setCurrentTab('chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenGraduationModal={() => setIsGraduationModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {currentTab === 'musicas' && <MusicView />}
        {currentTab === 'aulas' && <ClassesView />}
        {currentTab === 'videos' && <VideosView />}
        {currentTab === 'fotos' && <PhotosView />}
        {currentTab === 'recados' && <AnnouncementsView />}
        {currentTab === 'eventos' && <EventsView />}
        {currentTab === 'aniversariantes' && (
          <BirthdaysView onStartChatWithUser={handleStartChatWithUser} />
        )}
        {currentTab === 'chat' && <ChatView initialTargetPhone={chatTargetPhone} />}
        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminDashboardView onNavigateToTab={(tab) => setCurrentTab(tab)} />
          ) : (
            <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <p className="text-white font-bold text-base">Acesso Restrito</p>
              <p className="text-xs text-zinc-400 mt-1">Esta área é reservada para a administração da ABADÁ-Capoeira.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                Fazer Login de Administrador
              </button>
            </div>
          )
        )}
        {currentTab === 'perfil' && (
          <StudentProfileView
            onOpenGraduationModal={() => setIsGraduationModalOpen(true)}
            onNavigateToMusicTab={() => setCurrentTab('musicas')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/80 py-6 text-center text-xs text-zinc-600 space-y-1">
        <p className="font-semibold text-zinc-400">
          ABADÁ-Capoeira • Associação Brasileira de Apoio e Desenvolvimento da Arte-Capoeira
        </p>
        <p className="text-[11px] text-zinc-600">
          Fundada por Mestre Camisa • Sincronização em tempo real via Neon DB
        </p>
      </footer>

      {/* Audio Streaming Persistent Bar */}
      <AudioPlayerBar />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadCount={unreadCount}
      />

      {/* Modals */}
      <GraduationModal
        isOpen={isGraduationModalOpen}
        onClose={() => setIsGraduationModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider>
          <MainContent />
        </AudioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
