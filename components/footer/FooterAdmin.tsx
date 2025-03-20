'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, Pause, Play, User, Users, Volume2, VolumeX, X } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { FullScreenTimer } from '../timer/FullScreenTimer';
import { useTimer } from '@/contexts/TimerProvider';
import { useActiveSessions } from '@/hooks/use-active-session';
import { ActiveUsersParticles } from '../timer/ActiveUsersParticles';
import { FocusButton } from '../timer/FocusButton';

export default function Footer() {
  const {
    timeRemaining,
    timeElapsed,
    isRunning,
    isMuted,
    volume,
    sound,
    activity,
    duration,
    flowMode,
    togglePlayPause,
    toggleMute,
    setVolume,
    resetTimer,
    setSound,
    endSession,
    autoplayBlocked,
  } = useTimer();

  const [footerVisible, setFooterVisible] = useState(false);
  const [showFullScreenTimer, setShowFullScreenTimer] = useState(false);
  const prevSound = useRef('none');
  const { activeSessions } = useActiveSessions();
  const totalActiveUsers = activeSessions.reduce(
    (sum, session) => sum + session.active_users,
    0
  );

  // Enhanced effect - handles both footer visibility AND fullscreen detection
  useEffect(() => {
    // If sound just changed from 'none' to something else, show fullscreen
    if (prevSound.current === 'none' && sound !== 'none') {
      // This means a new session just started - show fullscreen
      setShowFullScreenTimer(true);
      setFooterVisible(false);
    }
    // Normal footer visibility logic
    else if (sound !== 'none' && !showFullScreenTimer) {
      setFooterVisible(true);
    } else if (sound === 'none') {
      setFooterVisible(false);
    }

    // Update prevSound for next comparison
    prevSound.current = sound;
  }, [sound, showFullScreenTimer]);

  const closeSession = () => {
    // Reset timer state - we should call resetTimer() and then set sound to 'none'
    endSession();
    setSound('none');
    resetTimer();
    setShowFullScreenTimer(false); // Add this line to ensure fullscreen is closed
    setFooterVisible(false);
  };

  const maximizeSession = () => {
    setShowFullScreenTimer(true);
    setFooterVisible(false);
  };

  const handleMinimize = () => {
    setShowFullScreenTimer(false);
    setFooterVisible(true);
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

  // Display fullscreen timer
  if (showFullScreenTimer) {
    return (
      <FullScreenTimer
        onClose={closeSession}
        onMinimize={handleMinimize}
      />
    );
  }

  // Display minimized footer
  if (footerVisible) {
    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-blue-500/90 animate-in slide-in-from-bottom-full [animation-duration:500ms] shadow-lg border-t border-white/10 flex flex-col"
        )}
      >
        {/* Progress bar - Top line style on mobile with increased height */}
        {!flowMode && (
          <div className="relative w-full h-[3px] sm:hidden bg-white/20">
            <div
              className="absolute top-0 left-0 h-full bg-white"
              style={{ width: `${Math.max(0, Math.min(100, ((duration - timeRemaining) * 100) / duration))}%` }}
            />
          </div>
        )}

        <div className="flex flex-row items-center justify-between px-3 py-3 sm:py-3 h-[64px] sm:h-18">
          {/* Activity info with larger size on mobile */}
          <div className="flex flex-row items-center gap-2.5 min-w-0 max-w-[40%] sm:w-1/3">
            <div className="flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-md sm:rounded-lg bg-white/20 backdrop-blur-sm text-lg sm:text-2xl shadow-inner">
              {getActivityIcon(activity)}
            </div>
            <div className="flex flex-col min-w-0">
              {/* <span className="font-medium text-sm sm:text-base sm:font-bold truncate text-white">Focus Session</span> */}
              <span className="text-base sm:text-base font-bold text-white drop-shadow-md xs:hidden whitespace-nowrap overflow-visible inline-block">
                {flowMode ? `Time Elapsed ${formatTime(timeElapsed)}` : `Time Remaining ${formatTime(timeRemaining)}`}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-white/70 truncate">
                {activity.charAt(0).toUpperCase() + activity.slice(1)}
              </span>
            </div>
          </div>

          {/* Controls with larger sizes on mobile */}
          <div className="flex flex-row items-center justify-end gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="p-2 sm:p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                onClick={maximizeSession}
              >
                <Maximize2 className="size-4 sm:size-4.5" />
              </button>

              <button
                className={cn(
                  "p-2.5 sm:p-3 rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95",
                  isRunning
                    ? "bg-white hover:bg-gray-50 text-blue-600"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                onClick={togglePlayPause}
              >
                {isRunning ?
                  <Pause className="size-4.5 sm:size-5" strokeWidth={1.6} /> :
                  <Play className="size-4.5 sm:size-5" />
                }
              </button>

              <button
                onClick={closeSession}
                className="p-2 sm:p-2.5 rounded-full bg-white/20 text-white hover:bg-red-500 transition-all"
              >
                <X className="size-4 sm:size-4.5" />
              </button>
            </div>

            <div className="hidden xs:flex flex-col items-center">
              <span className="text-base sm:text-lg font-bold text-white drop-shadow-md">
                {flowMode ? formatTime(timeElapsed) : formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Volume controls with adjusted size */}
          <div className="hidden sm:flex flex-row gap-2 items-center justify-end w-1/3">
            {sound !== 'none' && (
              <>
                <button onClick={toggleMute} className="p-1.5">
                  {isMuted ?
                    <VolumeX className="size-5 text-white/80 hover:text-white transition-colors" /> :
                    <Volume2 className="size-5 text-white/80 hover:text-white transition-colors" />}
                </button>
                <Slider
                  defaultValue={[volume]}
                  value={[volume]}
                  max={100}
                  step={1}
                  className="w-24 cursor-pointer"
                  onValueChange={value => setVolume(value[0])}
                />
              </>
            )}
          </div>
        </div>

        {/* Progress bar - Adjusted size for desktop */}
        {!flowMode && (
          <div className="hidden sm:flex flex-row items-center justify-center w-full">
            <div className="relative w-full h-2">
              <Progress
                value={((duration - timeRemaining) * 100) / duration}
                className="h-2 bg-white/20"
              />
            </div>
          </div>
        )}
      </div>
    );
  }


  // Replace the non-active session footer return statement with this improved version

  // Updated non-active session footer with counter on right side

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 shadow-lg h-[64px] sm:h-18 overflow-hidden">
      {/* Animated user particles in the background - using diverse emojis now */}
      <ActiveUsersParticles count={totalActiveUsers} />

      {/* Dark overlay to make content more visible */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="container relative z-10 mx-auto px-4 flex items-center justify-between h-full">
        {/* Left side: Empty div for proper spacing */}
        <div className="w-[80px] sm:w-[180px]"></div>

        {/* Center: Focus button only - SIMPLIFIED */}
        <div className="flex items-center justify-center">
          {/* Focus button - original styling */}
          <FocusButton />
        </div>

        {/* Right side: User counter - MOVED HERE */}
        <div className="flex items-center justify-end w-[80px] sm:w-[180px]">
        </div>

        {/* Activity breakdown - moved to bottom and made more compact */}
        {activeSessions.length > 1 && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 hidden sm:flex flex-wrap gap-1 justify-center">
            {activeSessions.map((session, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white/90 flex items-center"
              >
                {session.activity === 'study' && '📚'}
                {session.activity === 'work' && '💼'}
                {session.activity === 'code' && '💻'}
                {session.activity === 'draw' && '🎨'}
                {session.activity === 'focus' && '🧠'}
                <span className="font-medium ml-1">{session.active_users}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div >
  );
}