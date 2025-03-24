'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { Slider } from '../ui/slider';
import { useTimer } from '@/contexts/TimerProvider';
import { useActiveSessions } from '@/hooks/use-active-session';
import { ActiveUsersParticles } from '../timer/ActiveUsersParticles';
import { FocusButton } from '../timer/FocusButton';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { useIsClient } from '@/hooks/use-is-client';

interface FooterProps {
  position?: 'top' | 'bottom';
}

export default function Footer({ position = 'bottom' }: FooterProps) {
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
  const {
    showFullScreenTimer,
    setShowFullScreenTimer,
    wasManuallyMinimized,
    setWasManuallyMinimized
  } = useTimerUI();

  const prevSound = useRef('none');
  const { activeSessions } = useActiveSessions();
  const totalActiveUsers = activeSessions.reduce(
    (sum, session) => sum + session.active_users,
    0
  );

  // Use this to safely check window size
  const isClient = useIsClient();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screens
  useEffect(() => {
    if (!isClient) return;

    const checkSize = () => {
      // Check if screen width is less than sm breakpoint (640px in Tailwind by default)
      setIsMobile(window.innerWidth < 640);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [isClient]);

  // Enhanced effect for footer visibility with mobile consideration
  useEffect(() => {
    // For desktop: always show footer when no session is running
    // For mobile: only show footer when session is running

    if (sound !== 'none') {
      // Session running cases
      if (showFullScreenTimer) {
        // If full screen mode is active, don't show footer
        setFooterVisible(false);
      } else {
        // Session running but not fullscreen - show footer on all devices
        setFooterVisible(true);
      }
    } else {
      // No session running
      if (isMobile) {
        // On mobile, hide footer when no session is running
        setFooterVisible(false);
      } else {
        // On desktop, show footer when no session is running
        setFooterVisible(true);
      }
    }

    // Update prevSound for next comparison
    prevSound.current = sound;
  }, [sound, showFullScreenTimer, wasManuallyMinimized, isMobile]);

  const closeSession = () => {
    endSession();
    setSound('none');
    resetTimer();
    setShowFullScreenTimer(false);
    setFooterVisible(false);
    setWasManuallyMinimized(false); // Reset minimized preference
  };

  const maximizeSession = () => {
    setShowFullScreenTimer(true);
    setFooterVisible(false);
    setWasManuallyMinimized(false); // User explicitly maximized
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

  // Add positioning classes based on prop
  const positionClasses = position === 'top' ?
    'top-0 bottom-auto sm:bottom-0 sm:top-auto' :
    'bottom-0 top-auto';

  // If we should show the footer
  if (footerVisible) {
    // Active session footer
    if (sound !== 'none') {
      return (
        <div
          className={cn(
            "fixed inset-x-0 z-40 bg-gradient-to-r from-blue-500/95 via-indigo-500/95 to-blue-500/95 backdrop-blur-md animate-in slide-in-from-top-full sm:slide-in-from-bottom-full [animation-duration:500ms] shadow-lg border-t border-white/10 flex flex-col",
            positionClasses,
            position === 'top' && "sm:slide-in-from-bottom-full",
            position === 'top' && "border-b border-t-0 sm:border-t sm:border-b-0"
          )}
        >
          {/* Progress bar - Top line for all screen sizes when not in flow mode */}
          {!flowMode && (
            <div className="relative w-full h-[3px] bg-white/20">
              <div
                className="absolute top-0 left-0 h-full bg-blue-400"
                style={{ width: `${Math.max(0, Math.min(100, ((duration - timeRemaining) * 100) / duration))}%` }}
              />
            </div>
          )}

          <div className="flex flex-row items-center justify-between px-3 py-3 sm:py-3 h-[64px] sm:h-18">
            {/* Activity info with larger size on mobile */}
            <div className="flex flex-row items-center gap-2.5 min-w-0 max-w-[40%] sm:w-1/3">
              <div
                className="flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-md sm:rounded-lg bg-white/20 backdrop-blur-sm text-lg sm:text-2xl shadow-inner cursor-pointer"
                onClick={maximizeSession}
              >
                {getActivityIcon(activity)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-base font-bold text-white drop-shadow-md whitespace-nowrap overflow-visible inline-block">
                  {flowMode ? `Time ${formatTime(timeElapsed)}` : `Remaining ${formatTime(timeRemaining)}`}
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
                    className="w-24 cursor-pointer [&_[data-orientation=horizontal]]:h-1.5 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:opacity-90"
                    onValueChange={value => setVolume(value[0])}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // No active session footer - only visible on desktop
    return (
      <div className={cn(
        "fixed inset-x-0 z-40 flex items-center justify-center bg-gradient-to-r from-blue-500/95 via-indigo-500/95 to-blue-500/95 backdrop-blur-md shadow-lg h-[64px] sm:h-18 overflow-hidden hidden sm:flex", // Note the hidden sm:flex
        positionClasses,
        position === 'top' ? "border-b border-t-0 sm:border-t sm:border-b-0" : "border-t border-b-0"
      )}>
        {/* Animated user particles in the background */}
        <ActiveUsersParticles count={totalActiveUsers} />

        {/* Dark overlay to make content more visible */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="container relative z-10 mx-auto px-4 flex items-center justify-between h-full">
          {/* Left side: Empty div for proper spacing */}
          <div className="w-[80px] sm:w-[180px]"></div>

          {/* Center: Focus button only */}
          <div className="flex items-center justify-center">
            <FocusButton />
          </div>

          {/* Right side: User counter */}
          <div className="flex items-center justify-end w-[80px] sm:w-[180px]">
          </div>

          {/* Activity breakdown */}
          {activeSessions.length > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex flex-wrap gap-1 justify-center">
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
      </div>
    );
  }

  // Footer is hidden completely
  return null;
}