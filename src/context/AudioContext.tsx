import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../types';

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  showLyricsModal: boolean;
  queue: Song[];
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setShowLyricsModal: (show: boolean) => void;
  downloadSong: (song: Song) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playSong = (song: Song, newQueue?: Song[]) => {
    if (!audioRef.current) return;
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some(s => s.id === song.id)) {
      setQueue(prev => [...prev, song]);
    }

    setCurrentSong(song);
    audioRef.current.src = song.audio_url;
    audioRef.current.play().catch(err => {
      console.warn('Audio play prevented:', err);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => setIsLooping(prev => !prev);
  const toggleShuffle = () => setIsShuffled(prev => !prev);

  const handleNext = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playSong(queue[randomIndex]);
    } else if (currentIndex < queue.length - 1) {
      playSong(queue[currentIndex + 1]);
    } else if (isLooping) {
      playSong(queue[0]);
    }
  };

  const handlePrev = () => {
    if (queue.length === 0 || !currentSong) return;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) {
      playSong(queue[currentIndex - 1]);
    } else {
      seek(0);
    }
  };

  const downloadSong = (song: Song) => {
    const link = document.createElement('a');
    link.href = song.audio_url;
    link.download = `${song.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AudioContext.Provider value={{
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isLooping,
      isShuffled,
      showLyricsModal,
      queue,
      playSong,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
      toggleLoop,
      toggleShuffle,
      nextSong: handleNext,
      prevSong: handlePrev,
      setShowLyricsModal,
      downloadSong
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
