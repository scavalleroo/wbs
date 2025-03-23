'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useFocusSession } from '@/hooks/use-focus-session';
import { User } from '@supabase/supabase-js';
import { clearClosedSessionState, markSessionClosed, wasSessionClosed } from '@/utils/session-state';

interface TimerContextProps {
    autoplayBlocked: boolean;
    timeRemaining: number;
    timeElapsed: number;
    isRunning: boolean;
    isMuted: boolean;
    volume: number;
    sound: string;
    activity: string;
    duration: number;
    flowMode: boolean;
    sessionId: string | null;

    // Actions
    setTimeRemaining: (time: number) => void;
    setTimeElapsed: (time: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    togglePlayPause: () => void;
    toggleMute: () => void;
    setVolume: (value: number) => void;
    setSound: (sound: string) => void;
    resetTimer: () => void;
    initializeSession: (settings: TimerSettings) => void;
    endSession: (status?: 'completed' | 'abandoned') => void;
}

interface TimerSettings {
    activity: string;
    sound: string;
    duration: number; // in minutes
    volume: number;
    flowMode?: boolean;
    initialTimeRemaining?: number; // in seconds
    initialTimeElapsed?: number; // in seconds
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

export function TimerProvider({ children, user }: { children: ReactNode; user: User | null | undefined }) {
    // Get focus session functions
    const {
        startSession,
        endSession: endFocusSession,
        currentSession,
        checkForActiveSession
    } = useFocusSession({ user });

    // State
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(50);
    const [sound, setSound] = useState('none');
    const [activity, setActivity] = useState('focus');
    const [duration, setDuration] = useState(25 * 60); // 25 minutes in seconds
    const [flowMode, setFlowMode] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStartedAt = useRef<Date | null>(null);

    // Load existing session if available
    useEffect(() => {
        if (user?.id && currentSession) {
            const session = currentSession;

            // Load session state
            setActivity(session.activity);
            setSound(session.sound);
            setDuration(session.duration);
            setFlowMode(session.flow_mode);
            setSessionId(session.id);

            // Calculate time elapsed and remaining
            const startTime = new Date(session.started_at);
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

            if (session.flow_mode) {
                setTimeElapsed(elapsedSeconds);
                setTimeRemaining(0);
            } else {
                const remainingSeconds = Math.max(0, session.duration - elapsedSeconds);
                setTimeRemaining(remainingSeconds);
                setTimeElapsed(elapsedSeconds);
            }

            sessionStartedAt.current = startTime;
            setIsRunning(true);
        }
    }, [user?.id, currentSession]);

    // Check for existing session on mount
    useEffect(() => {
        if (user?.id) {
            checkActiveSession();
        }

        async function checkActiveSession() {
            const session = await checkForActiveSession();

            if (session && wasSessionClosed(session.id)) {
                await endFocusSession(session.id, 'abandoned');
                resetTimerState();
            }
        }
    }, [user?.id, checkForActiveSession]);

    // Initialize session with settings
    const initializeSession = async (settings: TimerSettings) => {
        setActivity(settings.activity);
        setSound(settings.sound);
        setDuration(settings.duration * 60); // Convert minutes to seconds
        setVolume(settings.volume);
        setFlowMode(!!settings.flowMode);

        // Set initial timer values
        if (settings.flowMode) {
            setTimeElapsed(settings.initialTimeElapsed || 0);
            setTimeRemaining(0);
        } else {
            setTimeRemaining(settings.initialTimeRemaining || settings.duration * 60);
            setTimeElapsed(0);
        }
        clearClosedSessionState();

        setIsRunning(true);
        sessionStartedAt.current = new Date();


        // Create session in database if user is logged in
        if (user?.id) {
            const session = await startSession({
                activity: settings.activity,
                sound: settings.sound,
                duration: settings.duration * 60, // Store in seconds
                flow_mode: !!settings.flowMode
            });

            if (session) {
                setSessionId(session.id);
            }
        }
    };

    // End current session
    const endSession = async (status: 'completed' | 'abandoned' = 'completed') => {
        // Calculate session duration if we have a start time
        if (sessionId && user?.id && sessionStartedAt.current) {
            const sessionDuration = Math.floor(
                (new Date().getTime() - sessionStartedAt.current.getTime()) / 1000
            );

            // If session was shorter than 60 seconds, mark as abandoned
            if (sessionDuration < 60 && status === 'completed') {
                status = 'abandoned';
            }

            // End database session
            await endFocusSession(sessionId, status);

            // Mark this session as manually closed to prevent auto-reopening
            markSessionClosed(sessionId);
        }

        // Reset timer state
        resetTimerState();
    };

    // Setup audio when sound changes
    useEffect(() => {
        if (sound !== 'none') {
            // Clean up previous audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            audioRef.current = new Audio(`/sounds/radios/${sound}.mp3`);
            audioRef.current.loop = true;
            audioRef.current.volume = volume / 100;

            if (isRunning && !isMuted) {
                // Try to play and handle autoplay blocking
                audioRef.current.play().then(() => {
                    // Playback started successfully
                    setAutoplayBlocked(false);
                }).catch(err => {
                    setAutoplayBlocked(true);
                });
            }
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setAutoplayBlocked(false);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sound]);

    // Timer logic
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (flowMode) {
                    // Count up for flow mode
                    setTimeElapsed(prev => prev + 1);
                } else {
                    // Count down for timed mode
                    setTimeRemaining(prev => {
                        if (prev <= 1) {
                            // Timer finished
                            clearInterval(timerRef.current!);
                            playEndSound();
                            setIsRunning(false);

                            // Mark session as completed if it exists
                            if (sessionId && user?.id) {
                                endFocusSession(sessionId, 'completed');
                                setSessionId(null);
                            }

                            return 0;
                        }
                        return prev - 1;
                    });

                    // Update elapsed time
                    setTimeElapsed(prev => prev + 1);
                }
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, flowMode]);

    // Audio playback based on state
    useEffect(() => {
        if (!audioRef.current) return;

        if (isRunning && !isMuted) {
            // Every time the play/pause state changes, try playing again
            // This will work after user interaction
            audioRef.current.play().then(() => {
                setAutoplayBlocked(false);
            }).catch(err => {
                setAutoplayBlocked(true);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isRunning, isMuted]);

    // Update volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    // Reset timer state but keep session active
    const resetTimer = () => {
        if (flowMode) {
            setTimeElapsed(0);
        } else {
            setTimeRemaining(duration);
            setTimeElapsed(0);
        }
        sessionStartedAt.current = new Date();
        setIsRunning(true);
    };

    // Reset all timer state including session
    const resetTimerState = () => {
        setSound('none');
        setActivity('focus');
        setDuration(25 * 60);
        setTimeRemaining(25 * 60);
        setTimeElapsed(0);
        setFlowMode(false);
        setIsRunning(false);
        setSessionId(null);
        sessionStartedAt.current = null;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => setIsRunning(true);
    const pauseTimer = () => setIsRunning(false);
    const togglePlayPause = () => setIsRunning(prev => !prev);
    const toggleMute = () => setIsMuted(prev => !prev);

    const playEndSound = () => {
        const endSound = new Audio('/sounds/timer-complete.mp3');
        endSound.play().catch(err => {
            // console.log('End sound autoplay prevented. User interaction required.');
        });
    };
    return (
        <TimerContext.Provider
            value={{
                autoplayBlocked,
                timeRemaining,
                timeElapsed,
                isRunning,
                isMuted,
                volume,
                sound,
                activity,
                duration,
                flowMode,
                sessionId,
                setTimeRemaining,
                setTimeElapsed,
                startTimer,
                pauseTimer,
                togglePlayPause,
                toggleMute,
                setVolume,
                setSound,
                resetTimer,
                initializeSession,
                endSession
            }}
        >
            {children}
        </TimerContext.Provider>
    );
}

// Custom hook to use the timer context
export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}