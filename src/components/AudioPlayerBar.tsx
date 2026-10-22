import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  FileText,
  Download,
  Heart,
  Maximize2,
  Minimize2,
  X,
  Music2
} from 'lucide-react';

export const AudioPlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLooping,
    isShuffled,
    showLyricsModal,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle,
    nextSong,
    prevSong,
    setShowLyricsModal,
    downloadSong
  } = useAudio();

  const { user } = useAuth();
  const { getAccentClasses } = useTheme();
  const accentClasses = getAccentClasses();

  const [isFav, setIsFav] = useState(currentSong?.is_favorite || false);
  const [lyricsFontSize, setLyricsFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Sync favorite state when currentSong changes
  React.useEffect(() => {
    if (currentSong) {
      setIsFav(!!currentSong.is_favorite);
    }
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Faça login para salvar suas músicas favoritas!');
      return;
    }
    try {
      const res = await api.toggleFavorite(user.phone, currentSong.id);
      setIsFav(res.is_favorite);
    } catch (err) {
      console.error(err);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Docked Floating Player */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl transition-all">
        {/* Progress track */}
        <div
          className="relative h-1.5 w-full bg-zinc-800 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seek(clickPos * duration);
          }}
        >
          <div
            className={`h-full ${accentClasses.primaryBg} relative transition-all duration-75`}
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-xs">
            <div className={`w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 ${accentClasses.glow}`}>
              <Music2 className={`w-5 h-5 ${accentClasses.primaryText}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {currentSong.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {currentSong.author || 'ABADÁ-Capoeira'}
              </p>
            </div>
            <button
              onClick={handleToggleFavorite}
              title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition hidden sm:block shrink-0"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Central Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleShuffle}
                title="Aleatório"
                className={`p-1.5 rounded-lg text-xs hidden sm:block transition ${
                  isShuffled ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevSong}
                className="p-1.5 text-zinc-400 hover:text-white transition"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className={`p-2.5 rounded-full ${accentClasses.primaryBg} text-black font-bold shadow-lg hover:scale-105 active:scale-95 transition`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
              </button>

              <button
                onClick={nextSong}
                className="p-1.5 text-zinc-400 hover:text-white transition"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleLoop}
                title="Repetir"
                className={`p-1.5 rounded-lg text-xs hidden sm:block transition ${
                  isLooping ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Actions & Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lyrics Button */}
            <button
              onClick={() => setShowLyricsModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                showLyricsModal
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Ver Letra da Música"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Letra</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadSong(currentSong)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              title="Baixar MP3 no dispositivo"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Volume slider (desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-zinc-700 accent-amber-500 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen / Reader Lyrics Modal */}
      {showLyricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Lyrics Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${accentClasses.badge} border`}>
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {currentSong.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {currentSong.author || 'ABADÁ-Capoeira'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Font size toggle for reading in roda */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setLyricsFontSize('normal')}
                    className={`px-2 py-0.5 rounded ${lyricsFontSize === 'normal' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setLyricsFontSize('large')}
                    className={`px-2 py-0.5 rounded text-sm ${lyricsFontSize === 'large' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setLyricsFontSize('xlarge')}
                    className={`px-2 py-0.5 rounded text-base ${lyricsFontSize === 'xlarge' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    A++
                  </button>
                </div>

                <button
                  onClick={() => setShowLyricsModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lyrics Content with large readable typography */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
              {currentSong.lyrics ? (
                <div
                  className={`whitespace-pre-line font-medium leading-relaxed tracking-wide text-zinc-200 select-text ${
                    lyricsFontSize === 'normal'
                      ? 'text-sm sm:text-base'
                      : lyricsFontSize === 'large'
                      ? 'text-base sm:text-xl leading-loose'
                      : 'text-xl sm:text-2xl leading-loose font-semibold'
                  }`}
                >
                  {currentSong.lyrics}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-base font-semibold text-zinc-400">Letra ainda não cadastrada</p>
                  <p className="text-xs text-zinc-600 mt-1">Os administradores podem adicionar a letra completa na edição da música.</p>
                </div>
              )}
            </div>

            {/* Lyrics Footer Bar */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className={`px-4 py-2 rounded-xl ${accentClasses.primaryBg} text-black font-bold text-xs sm:text-sm flex items-center gap-2`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlaying ? 'Pausar Áudio' : 'Ouvir Música'}
                </button>
                <button
                  onClick={() => downloadSong(currentSong)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar MP3
                </button>
              </div>

              <span className="text-xs text-zinc-500 hidden sm:inline">
                ABADÁ-Capoeira • Acervo Oficial
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
