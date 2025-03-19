'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Brain, Maximize2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { FocusButton } from '../timer/FocusButton';
import { FullScreenTimer } from '../timer/FullScreenTimer';
import { useTimer } from '@/contexts/TimerProvider';

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
    setVolume
  } = useTimer();

  const [footerVisible, setFooterVisible] = useState(false);
  const [showFullScreenTimer, setShowFullScreenTimer] = useState(false);

  useEffect(() => {
    // Only show footer if there's an active session (detected by sound being set)
    if (sound !== 'none' && !showFullScreenTimer) {
      setFooterVisible(true);
    }
  }, [sound, showFullScreenTimer]);

  const closeSession = () => {
    // Reset timer state
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
        onClose={() => {
          setShowFullScreenTimer(false);
          setFooterVisible(true);
        }}
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
        {/* Progress bar - Top line style on mobile */}
        {!flowMode && (
          <div className="relative w-full h-[1px] sm:hidden bg-white/20">
            <div
              className="absolute top-0 left-0 h-full bg-white"
              style={{ width: `${Math.max(0, Math.min(100, ((duration - timeRemaining) * 100) / duration))}%` }}
            />
          </div>
        )}

        <div className="flex flex-row items-center justify-between px-3 py-2 sm:py-2.5 h-[50px] sm:h-16">
          {/* Rest of the content remains the same, just with adjusted heights and padding */}
          {/* Activity info with adjusted size */}
          <div className="flex flex-row items-center gap-2 min-w-0 max-w-[40%] sm:w-1/3">
            <div className="flex items-center justify-center h-7 w-7 sm:h-12 sm:w-12 rounded-md sm:rounded-lg bg-white/20 backdrop-blur-sm text-base sm:text-2xl shadow-inner">
              {getActivityIcon(activity)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-xs sm:text-sm sm:font-bold truncate text-white">Focus Session</span>
              <span className="text-[9px] sm:text-xs font-medium text-white/70 truncate">
                {activity.charAt(0).toUpperCase() + activity.slice(1)}
              </span>
            </div>
          </div>

          {/* Controls with adjusted sizes */}
          <div className="flex flex-row items-center justify-end gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-bold text-white drop-shadow-md xs:hidden mr-1">
              {flowMode ? formatTime(timeElapsed) : formatTime(timeRemaining)}
            </span>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="p-1.5 sm:p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                onClick={maximizeSession}
              >
                <Maximize2 className="size-3 sm:size-4" />
              </button>

              <button
                className={`p-1.5 sm:p-2.5 rounded-full ${isRunning ? 'bg-white' : 'bg-blue-400'} text-blue-600 shadow-md hover:shadow-lg transition-all`}
                onClick={togglePlayPause}
              >
                {isRunning ?
                  <Pause className="size-3 sm:size-5" strokeWidth={1.6} /> :
                  <Play className="size-3 sm:size-5" />}
              </button>

              <button
                onClick={closeSession}
                className="p-1.5 sm:p-2 rounded-full bg-white/20 text-white hover:bg-red-500 transition-all"
              >
                <X className="size-3 sm:size-4" />
              </button>
            </div>

            <div className="hidden xs:flex flex-col items-center">
              <span className="text-xs sm:text-lg font-bold text-white drop-shadow-md">
                {flowMode ? formatTime(timeElapsed) : formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Volume controls with adjusted size */}
          <div className="hidden sm:flex flex-row gap-2 items-center justify-end w-1/3">
            {sound !== 'none' && (
              <>
                <button onClick={toggleMute} className="p-1">
                  {isMuted ?
                    <VolumeX className="size-4 text-white/80 hover:text-white transition-colors" /> :
                    <Volume2 className="size-4 text-white/80 hover:text-white transition-colors" />}
                </button>
                <Slider
                  defaultValue={[volume]}
                  value={[volume]}
                  max={100}
                  step={1}
                  className="w-20 cursor-pointer"
                  onValueChange={value => setVolume(value[0])}
                />
              </>
            )}
          </div>
        </div>

        {/* Progress bar - Adjusted size */}
        {!flowMode && (
          <div className="hidden sm:flex flex-row items-center justify-center w-full">
            <div className="relative w-full h-1.5">
              <Progress
                value={((duration - timeRemaining) * 100) / duration}
                className="h-1.5 bg-white/20"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default footer with focus button - Keep this height as the reference
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 py-3 sm:py-4 flex items-center bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 shadow-lg">
      <div className="container mx-auto px-4 flex justify-center">
        <EnhancedFocusButton />
      </div>
    </div>
  );
}

// Enhanced focus button with modern gradient design
function EnhancedFocusButton() {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-70 group-hover:opacity-100 transition-all duration-500"></div>
      <div className="relative">
        <FocusButton />
      </div>
    </div>
  );
}