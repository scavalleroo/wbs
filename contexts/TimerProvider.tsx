'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface TimerContextProps {
    timeRemaining: number;
    timeElapsed: number;
    isRunning: boolean;
    isMuted: boolean;
    volume: number;
    sound: string;
    activity: string;
    duration: number;
    flowMode: boolean;

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

export function TimerProvider({ children }: { children: ReactNode }) {
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

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize session with settings
    const initializeSession = (settings: TimerSettings) => {
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

        setIsRunning(true);
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
                audioRef.current.play().catch(console.error);
            }
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
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
                            return 0;
                        }
                        return prev - 1;
                    });
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
            audioRef.current.play().catch(console.error);
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

    const startTimer = () => setIsRunning(true);
    const pauseTimer = () => setIsRunning(false);
    const togglePlayPause = () => setIsRunning(prev => !prev);
    const toggleMute = () => setIsMuted(prev => !prev);

    const resetTimer = () => {
        if (flowMode) {
            setTimeElapsed(0);
        } else {
            setTimeRemaining(duration);
        }
        setIsRunning(true);
    };

    const playEndSound = () => {
        const endSound = new Audio('/sounds/timer-complete.mp3');
        endSound.play().catch(console.error);
    };

    return (
        <TimerContext.Provider
            value={{
                timeRemaining,
                timeElapsed,
                isRunning,
                isMuted,
                volume,
                sound,
                activity,
                duration,
                flowMode,
                setTimeRemaining,
                setTimeElapsed,
                startTimer,
                pauseTimer,
                togglePlayPause,
                toggleMute,
                setVolume,
                setSound,
                resetTimer,
                initializeSession
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