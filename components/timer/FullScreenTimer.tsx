import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Minimize2, X, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { AnalogClock } from './AnalogClock';
import { cn } from '@/lib/utils';

interface FullScreenTimerProps {
    onClose: () => void;
    onMinimize: (session: any) => void;
    initialSettings?: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    };
}

export function FullScreenTimer({
    onClose,
    onMinimize,
    initialSettings = {
        activity: 'focus',
        sound: 'lofi',
        duration: 25,
        volume: 50,
        flowMode: false
    }
}: FullScreenTimerProps) {
    const [isRunning, setIsRunning] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(
        initialSettings.flowMode ? 0 : initialSettings.duration * 60
    );
    const [timeElapsed, setTimeElapsed] = useState(0);
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

    // Handle timer based on mode
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                if (initialSettings.flowMode) {
                    // Count up for flow mode
                    setTimeElapsed(prev => prev + 1);
                } else {
                    // Count down for timed mode
                    setTimeRemaining(prev => {
                        if (prev <= 1) {
                            // Timer finished
                            clearInterval(timerRef.current!);
                            playEndSound();
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
    }, [isRunning, initialSettings.flowMode]);

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
        const currentSession = {
            activity: initialSettings.activity,
            activityIcon: getActivityIcon(initialSettings.activity),
            sound: initialSettings.sound,
            duration: initialSettings.flowMode ? timeElapsed : initialSettings.duration * 60,
            timeRemaining: initialSettings.flowMode ? 0 : timeRemaining,
            timeElapsed: initialSettings.flowMode ? timeElapsed : 0,
            isRunning,
            isMuted,
            volume,
            flowMode: initialSettings.flowMode
        };

        onMinimize(currentSession);
    };

    const resetTimer = () => {
        if (initialSettings.flowMode) {
            setTimeElapsed(0);
        } else {
            setTimeRemaining(initialSettings.duration * 60);
        }
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

    const getActivityIcon = (activity: string) => {
        switch (activity) {
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
    const progressPercentage = initialSettings.flowMode
        ? Math.min(100, (timeElapsed / (60 * 60)) * 100) // Scale to hourly progress for flow mode
        : 100 - (timeRemaining / (initialSettings.duration * 60)) * 100; // Invert for completion percentage

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
                            {getActivityIcon(initialSettings.activity)}
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
                                    timeRemaining={initialSettings.flowMode ? timeElapsed : timeRemaining}
                                    totalTime={initialSettings.flowMode ? 3600 : initialSettings.duration * 60}
                                    flowMode={initialSettings.flowMode}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowAnalogClock(true)}
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <div className="text-[120px] font-bold text-center bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                    {initialSettings.flowMode ? formatTime(timeElapsed) : formatTime(timeRemaining)}
                                </div>
                                <div className="text-neutral-500 text-sm -mt-4">
                                    {initialSettings.flowMode ? "Time elapsed" : "Time remaining"}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-80 mb-8 flex items-center justify-center">
                        {!initialSettings.flowMode && (
                            <div className="w-full space-y-2">
                                <div className="relative h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-full transition-all"
                                        style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        {initialSettings.flowMode && timeElapsed > 0 && (
                            <div className="text-center">
                                <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-clip-text text-transparent font-medium text-sm">
                                    {Math.floor(timeElapsed / 60)} minutes focused
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Main controls */}
                    <div className="flex gap-4">
                        <Button
                            variant={isRunning ? "destructive" : "default"}
                            size="lg"
                            onClick={togglePlayPause}
                            className={cn(
                                "px-8 py-6 text-lg rounded-full shadow-lg transition-all min-w-[160px]",
                                isRunning
                                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700"
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
                            className="rounded-full px-8 py-6 text-lg border-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all min-w-[160px]"
                        >
                            <RefreshCw className="h-6 w-6 mr-2" />
                            Reset
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