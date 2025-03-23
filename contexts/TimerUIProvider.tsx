'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

interface TimerUIContextProps {
  showFullScreenTimer: boolean;
  setShowFullScreenTimer: (value: boolean) => void;
  wasManuallyMinimized: boolean;
  setWasManuallyMinimized: (value: boolean) => void;
}

const TimerUIContext = createContext<TimerUIContextProps | undefined>(undefined);

// Local storage keys
const MINIMIZED_KEY = 'weko-timer-minimized';

export function TimerUIProvider({ children }: { children: ReactNode }) {
  const [showFullScreenTimer, setShowFullScreenTimerState] = useState(false);
  const [wasManuallyMinimized, setWasManuallyMinimized] = useState(false);

  // Add transition lock to prevent rapid state toggling
  const isTransitioningRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load minimized preference on mount
  useEffect(() => {
    const savedMinimizedPref = localStorage.getItem(MINIMIZED_KEY);
    if (savedMinimizedPref === 'true') {
      setWasManuallyMinimized(true);
    }

    return () => {
      // Clean up any pending timers
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Save minimized preference whenever it changes
  useEffect(() => {
    localStorage.setItem(MINIMIZED_KEY, wasManuallyMinimized.toString());
  }, [wasManuallyMinimized]);

  // Create a wrapper for setShowFullScreenTimer that includes a transition lock
  const setShowFullScreenTimer = (value: boolean) => {
    // Skip if we're already in a transition
    if (isTransitioningRef.current) return;

    // Set the transition lock
    isTransitioningRef.current = true;

    // Update the state
    setShowFullScreenTimerState(value);

    // Release the lock after a short delay
    timerRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 100);
  };

  return (
    <TimerUIContext.Provider value={{
      showFullScreenTimer,
      setShowFullScreenTimer,
      wasManuallyMinimized,
      setWasManuallyMinimized
    }}>
      {children}
    </TimerUIContext.Provider>
  );
}

export function useTimerUI() {
  const context = useContext(TimerUIContext);
  if (context === undefined) {
    throw new Error('useTimerUI must be used within a TimerUIProvider');
  }
  return context;
}