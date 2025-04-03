'use client';

import { PlayCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { FocusSelector } from './FocusSelector';
import { useTimer } from '@/contexts/TimerProvider';
import { useActiveSessions } from '@/hooks/use-active-session';
import { useTimerUI } from '@/contexts/TimerUIProvider';

export function FocusButton() {
    const [showFocusSelector, setShowFocusSelector] = useState(false);
    const { activeSessions } = useActiveSessions();
    const totalActiveUsers = activeSessions.reduce(
        (sum, session) => sum + session.active_users,
        0
    ) || 30;

    // Use the shared UI context with additional user preference
    const {
        showFullScreenTimer,
        setShowFullScreenTimer,
        setWasManuallyMinimized
    } = useTimerUI();

    // Track if we need to show fullscreen
    const pendingFullscreen = useRef(false);

    // Use the shared timer context
    const { initializeSession, sound, endSession } = useTimer();

    // When FocusSelector's start button is clicked
    const startFocusSession = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        // First close the selector and mark that we want to show fullscreen
        pendingFullscreen.current = true;
        setShowFocusSelector(false);

        // New session starting - always reset the minimized preference
        setWasManuallyMinimized(false);

        // Initialize the session with the settings
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration,
            volume: settings.volume || 50,
            flowMode: settings.flowMode || false,
            initialTimeRemaining: settings.flowMode ? 0 : settings.duration * 60,
            initialTimeElapsed: 0
        });
    };

    // This listens for the selector to be closed
    useEffect(() => {
        if (!showFocusSelector && pendingFullscreen.current) {
            // Clear the pending flag
            pendingFullscreen.current = false;

            // Show fullscreen after a short delay
            setTimeout(() => {
                setShowFullScreenTimer(true);
            }, 100);
        }
    }, [showFocusSelector, setShowFullScreenTimer]);

    // Ensure sound state is synced with UI
    useEffect(() => {
        // If sound was set after selector close but fullscreen isn't showing
        if (sound !== 'none' && !showFullScreenTimer && !showFocusSelector && !pendingFullscreen.current) {
            setShowFullScreenTimer(true);
        }
    }, [sound, showFullScreenTimer, showFocusSelector, setShowFullScreenTimer]);

    // Handle the close action from the fullscreen selector
    const handleSelectorClose = () => {
        if (!pendingFullscreen.current) {
            setShowFocusSelector(false);
        }
    };

    return (
        <>
            <div className="relative group transform-gpu">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                <div className="relative">
                    <button
                        onClick={() => setShowFocusSelector(true)}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-indigo-600 rounded-full flex items-center gap-1.5 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        <PlayCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        <span className="whitespace-nowrap">Start Focus Session</span>
                    </button>
                </div>
            </div>

            {/* Fullscreen Focus Selector */}
            {showFocusSelector && (
                <FocusSelector
                    onStart={startFocusSession}
                    onClose={handleSelectorClose}
                />
            )}
        </>
    );
}