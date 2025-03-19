import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Minimize2, X, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { AnalogClock } from './AnalogClock';
import { cn } from '@/lib/utils';

interface FullScreenTimerProps {
    onClose: () => void;
    onMinimize: () => void;
    initialSettings?: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
    };
}

export function FullScreenTimer({
    onClose,
    onMinimize,
    initialSettings = {
        activity: 'focus',
        sound: 'lofi',
        duration: 25,
        volume: 50
    }
}: FullScreenTimerProps) {
    const [isRunning, setIsRunning] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(initialSettings.duration * 60);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(initialSettings.volume);
    const [showAnalogClock, setShowAnalogClock] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize audio
    useEffect(() => {
        if (initialSettings.sound !== 'none') {
            audioRef.current = new Audio(`/sounds/radios/${initialSettings.sound}.mp3`);
            audioRef.current.loop = true;
            audioRef.current.volume = volume / 100;

            if (isRunning && !isMuted) {
                audioRef.current.play().catch(console.error);
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle timer
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Timer finished
                        clearInterval(timerRef.current!);
                        playEndSound();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    // Handle audio playback based on state
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

    const togglePlayPause = () => {
        setIsRunning(prev => !prev);
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    const handleMinimize = () => {
        // Pass current session state to the minimized view
        onMinimize();
    };

    const resetTimer = () => {
        setTimeRemaining(initialSettings.duration * 60);
        setIsRunning(true);
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

    const getActivityIcon = () => {
        switch (initialSettings.activity) {
            case 'study': return '📚';
            case 'work': return '💼';
            case 'code': return '💻';
            case 'draw': return '🎨';
            default: return '🧠';
        }
    };

    const getActivityName = () => {
        return initialSettings.activity.charAt(0).toUpperCase() + initialSettings.activity.slice(1);
    };

    const getSoundName = () => {
        switch (initialSettings.sound) {
            case 'lofi': return 'Lo-Fi Radio';
            case 'nature': return 'Nature Sounds';
            case 'rain': return 'Rain';
            case 'cafe': return 'Café Ambience';
            case 'none': return 'No Sound';
            default: return 'Sound';
        }
    };

    // Calculate progress percentage for the timer
    const progressPercentage = (timeRemaining / (initialSettings.duration * 60)) * 100;

    return (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 overflow-hidden flex flex-col">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Top bar with controls */}
                <div className="flex justify-between items-center p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl shadow-lg">
                            {getActivityIcon()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{getActivityName()} Focus</h1>
                            {initialSettings.sound !== 'none' && (
                                <p className="text-sm text-neutral-500 flex items-center gap-1">
                                    <Volume2 className="h-3 w-3" /> {getSoundName()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleMinimize}>
                            <Minimize2 className="h-4 w-4 mr-2" />
                            Minimize
                        </Button>
                        <Button variant="outline" size="sm" onClick={onClose}>
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                    </div>
                </div>

                {/* Main timer display */}
                <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                        {showAnalogClock ? (
                            <div onClick={() => setShowAnalogClock(false)} className="cursor-pointer">
                                <AnalogClock
                                    timeRemaining={timeRemaining}
                                    totalTime={initialSettings.duration * 60}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowAnalogClock(true)}
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <div className="text-[120px] font-bold text-center bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                    {formatTime(timeRemaining)}
                                </div>
                                <div className="text-neutral-500 text-sm -mt-4">
                                    {Math.floor(progressPercentage)}% completed
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-80 mb-8">
                        <Progress
                            value={progressPercentage}
                            className="h-2 bg-neutral-200 dark:bg-neutral-700"
                        />
                    </div>

                    {/* Main controls */}
                    <div className="flex gap-4">
                        <Button
                            variant={isRunning ? "destructive" : "default"}
                            size="lg"
                            onClick={togglePlayPause}
                            className={cn(
                                "px-8 py-6 text-lg rounded-full shadow-lg",
                                isRunning
                                    ? "bg-white border-2 border-red-500 text-red-500 hover:bg-red-50"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                            )}
                        >
                            {isRunning ? <Pause className="h-6 w-6 mr-2" /> : <Play className="h-6 w-6 mr-2" />}
                            {isRunning ? "Pause" : "Resume"}
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={resetTimer}
                            className="rounded-full px-6 py-6"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Bottom bar with volume control */}
                {initialSettings.sound !== 'none' && (
                    <div className="p-6 flex justify-center">
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-6 py-3 flex items-center gap-4 shadow-md">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full"
                                onClick={toggleMute}
                            >
                                {isMuted ?
                                    <VolumeX className="h-5 w-5 text-neutral-400" /> :
                                    <Volume2 className="h-5 w-5 text-blue-500" />}
                            </Button>

                            <Slider
                                defaultValue={[volume]}
                                min={0}
                                max={100}
                                step={1}
                                value={[volume]}
                                onValueChange={(values) => setVolume(values[0])}
                                className="w-56 cursor-pointer"
                                disabled={isMuted}
                            />

                            <span className="text-sm w-8 text-neutral-500 font-medium">
                                {isMuted ? "Muted" : `${volume}%`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}