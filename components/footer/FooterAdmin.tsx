'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Brain, Maximize2, Pause, Play, Volume2, VolumeX, X, PlayCircle } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { FocusButton } from '../timer/FocusButton';

interface FocusSession {
  activity: string;
  activityIcon: string;
  sound: string;
  duration: number; // total seconds
  timeRemaining: number; // seconds remaining
  isRunning: boolean;
  isMuted: boolean;
  volume: number; // 0-100
}

export default function Footer() {
  const [minimizedSession, setMinimizedSession] = useState<FocusSession | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [footerVisible, setFooterVisible] = useState(false);

  // Setup audio when minimized session changes
  useEffect(() => {
    if (minimizedSession && minimizedSession.sound !== 'none') {
      const audio = new Audio(`/sounds/radios/${minimizedSession.sound}.mp3`);
      audio.loop = true;
      audio.volume = minimizedSession.volume / 100;
      setAudioRef(audio);

      if (minimizedSession.isRunning && !minimizedSession.isMuted) {
        audio.play().catch(console.error);
      }

      setFooterVisible(true);
      return () => {
        audio.pause();
        setAudioRef(null);
      };
    }
    return undefined;
  }, [minimizedSession?.sound]);

  // Handle audio playback based on state
  useEffect(() => {
    if (!audioRef || !minimizedSession) return;

    if (minimizedSession.isRunning && !minimizedSession.isMuted) {
      audioRef.play().catch(console.error);
    } else {
      audioRef.pause();
    }
  }, [minimizedSession?.isRunning, minimizedSession?.isMuted]);

  // Update volume
  useEffect(() => {
    if (audioRef && minimizedSession) {
      audioRef.volume = minimizedSession.volume / 100;
    }
  }, [minimizedSession?.volume]);

  // Timer countdown
  useEffect(() => {
    if (!minimizedSession || !minimizedSession.isRunning) return;

    const interval = setInterval(() => {
      setMinimizedSession(prev => {
        if (!prev) return prev;

        if (prev.timeRemaining <= 1) {
          // Timer finished
          playEndSound();
          return { ...prev, timeRemaining: 0, isRunning: false };
        }

        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [minimizedSession?.isRunning]);

  const togglePlayPause = () => {
    if (!minimizedSession) return;

    setMinimizedSession({
      ...minimizedSession,
      isRunning: !minimizedSession.isRunning
    });
  };

  const toggleMute = () => {
    if (!minimizedSession) return;

    setMinimizedSession({
      ...minimizedSession,
      isMuted: !minimizedSession.isMuted
    });
  };

  const handleVolumeChange = (value: number[]) => {
    if (!minimizedSession) return;

    setMinimizedSession({
      ...minimizedSession,
      volume: value[0]
    });
  };

  const closeSession = () => {
    setMinimizedSession(null);
    setFooterVisible(false);

    if (audioRef) {
      audioRef.pause();
      setAudioRef(null);
    }
  };

  const maximizeSession = () => {
    // This would normally open the full screen timer
    console.log('Maximize session', minimizedSession);
  };

  const playEndSound = () => {
    const endSound = new Audio('/sounds/timer-complete.mp3');
    endSound.play().catch(console.error);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'study': return '📚';
      case 'work': return '💼';
      case 'code': return '💻';
      case 'draw': return '🎨';
      default: return '🧠';
    }
  };

  // When minimized session is active, show timer controls
  if (footerVisible && minimizedSession) {
    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 h-20 bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-blue-500/90 animate-in slide-in-from-bottom-full [animation-duration:500ms] shadow-lg border-t border-white/10"
        )}
      >
        <div className="flex flex-row items-center justify-between px-4 py-2 gap-8 h-full">
          <div className="flex flex-row items-center gap-2 w-1/3">
            <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-white/20 backdrop-blur-sm text-3xl shadow-inner">
              {minimizedSession.activityIcon || getActivityIcon(minimizedSession.activity)}
            </div>
            <div className="flex flex-col gap-1 truncate">
              <span className="font-bold truncate text-white">Focus Session</span>
              <span className="text-xs font-medium text-white/80">
                {minimizedSession.activity.charAt(0).toUpperCase() + minimizedSession.activity.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex-grow flex flex-col gap-1 items-center justify-center max-w-screen-sm h-full">
            <div className='flex flex-row gap-4 items-center'>
              <button
                className={`p-3 rounded-full ${minimizedSession.isRunning ? 'bg-white' : 'bg-blue-400'} text-blue-600 shadow-md hover:shadow-lg transition-all`}
                onClick={togglePlayPause}
              >
                {minimizedSession.isRunning ?
                  <Pause className="size-5" strokeWidth={1.6} /> :
                  <Play className="size-5" />}
              </button>
              <span className="text-2xl font-bold text-white drop-shadow-md">
                {formatTime(minimizedSession.timeRemaining)}
              </span>
              <button
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                onClick={maximizeSession}
              >
                <Maximize2 className="size-5" />
              </button>
            </div>
            <div className="flex flex-row items-center justify-center w-full gap-2">
              <div className="relative w-full h-2">
                <Progress
                  value={(minimizedSession.timeRemaining * 100) / (minimizedSession.duration)}
                  className="h-2 bg-white/20"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center w-1/3 justify-end gap-2">
            <div className='flex-row flex gap-2 justify-end w-full h-full'>
              {minimizedSession.sound !== 'none' && (
                <>
                  <button onClick={toggleMute}>
                    {minimizedSession.isMuted ?
                      <VolumeX className="size-5 text-white/80 hover:text-white transition-colors" /> :
                      <Volume2 className="size-5 text-white/80 hover:text-white transition-colors" />}
                  </button>
                  <Slider
                    defaultValue={[minimizedSession.volume]}
                    value={[minimizedSession.volume]}
                    max={100}
                    step={1}
                    className="w-24 cursor-pointer"
                    onValueChange={handleVolumeChange}
                  />
                </>
              )}
              <Button variant="ghost" size="icon" onClick={closeSession} className="text-white/80 hover:text-white hover:bg-white/10">
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default footer with centered Focus button
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 shadow-lg">
      <div className="container mx-auto px-4 flex justify-center">
        <EnhancedFocusButton onMinimize={setMinimizedSession} />
      </div>
    </div>
  );
}

// Enhanced focus button with modern gradient design
function EnhancedFocusButton({ onMinimize }: { onMinimize: (session: any) => void }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
      <div className="relative">
        <FocusButton onMinimize={onMinimize} />
      </div>
    </div>
  );
}