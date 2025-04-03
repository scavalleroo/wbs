import { useEffect, useRef, useState } from 'react';
import { Minimize2, X, Volume2, VolumeX, Music, ChevronDown, CheckCircle2, Trophy, Clock, HomeIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { AnalogClock } from './AnalogClock';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { useTimer } from '@/contexts/TimerProvider';
import { useActiveSessions } from '@/hooks/use-active-session';
import { useTimerUI } from '@/contexts/TimerUIProvider'; // Import the TimerUI hook
import confetti from 'canvas-confetti';

// Sound options remain the same
const SOUNDS = [
    { id: 'waves', name: 'Beach Waves', src: '/sounds/radios/waves.mp3', emoji: '🏝️' },
    { id: 'nature', name: 'Nature Sounds', src: '/sounds/radios/nature.mp3', emoji: '🌿' },
    { id: 'rain', name: 'Rain', src: '/sounds/radios/rain.mp3', emoji: '🌧️' },
    { id: 'fireplace', name: 'Fireplace', src: '/sounds/radios/fireplace.mp3', emoji: '🔥' },
    { id: 'brown', name: 'Brown Noise', src: '/sounds/radios/brown.mp3', emoji: '🟤' },
    { id: 'cafe', name: 'Café Ambience', src: '/sounds/radios/cafe.mp3', emoji: '☕' },
    { id: 'campfire', name: 'Campfire', src: '/sounds/radios/campfire.mp3', emoji: '🏕️' },
    { id: 'waterfall', name: 'Waterfall', src: '/sounds/radios/waterfall.mp3', emoji: '🌊' },
    { id: 'heater', name: 'Heater', src: '/sounds/radios/heater.mp3', emoji: '🔌' },
    { id: 'none', name: 'No Sound', src: '', emoji: '🔇' },
];

// Updated props - no need for onClose/onMinimize props anymore
export function FullScreenTimer() {
    // Get timer state from context
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
        setSound,
        resetTimer,
        endSession,
        autoplayBlocked,
    } = useTimer();

    // Local UI state only (not timer state)
    const [showAnalogClock, setShowAnalogClock] = useState(false);
    const { activeSessions } = useActiveSessions();
    const {
        setShowFullScreenTimer,
        setWasManuallyMinimized
    } = useTimerUI();

    // Use refs to track click state and prevent double-click issues
    const containerRef = useRef<HTMLDivElement>(null);
    const isMinimizingRef = useRef(false);
    const isClosingRef = useRef(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        duration: 0,
        activity: '',
    });
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const handleMinimize = (e: React.MouseEvent) => {
        // Prevent event bubbling
        e.stopPropagation();

        // Mark that user explicitly minimized the timer
        setWasManuallyMinimized(true);

        // Hide the fullscreen timer
        setShowFullScreenTimer(false);

        // For immediate visual feedback, hide the container directly
        if (containerRef.current) {
            containerRef.current.style.display = 'none';
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        // Prevent event bubbling
        e.stopPropagation();

        // Return early if action is already in progress
        if (isClosingRef.current) return;

        // Set flag to prevent multiple clicks
        isClosingRef.current = true;

        // Save session stats before ending
        setSessionStats({
            duration: flowMode ? timeElapsed : (duration - timeRemaining),
            activity: activity,
        });

        // Show celebration instead of immediately closing
        setShowCelebration(true);

        // Trigger confetti
        if (confettiCanvasRef.current) {
            const myConfetti = confetti.create(confettiCanvasRef.current, {
                resize: true,
                useWorker: true
            });

            // Fire multiple confetti bursts
            const end = Date.now() + 2000;
            const colors = ['#3B82F6', '#4F46E5', '#9333EA', '#10B981'];

            (function frame() {
                myConfetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.65 },
                    colors: colors
                });
                myConfetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.65 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }

        // End the session
        endSession();
    };

    const completeFocusSession = () => {
        // Reset minimized preference on close
        setWasManuallyMinimized(false);

        // Hide the fullscreen timer
        setShowFullScreenTimer(false);

        // Hide celebration
        setShowCelebration(false);

        // For immediate visual feedback, hide the container directly
        if (containerRef.current) {
            containerRef.current.style.display = 'none';
        }
    };

    // Reset refs when component mounts/unmounts
    useEffect(() => {
        isMinimizingRef.current = false;
        isClosingRef.current = false;

        return () => {
            isMinimizingRef.current = false;
            isClosingRef.current = false;
        };
    }, []);

    // Format current time as HH:MM
    const formatCurrentTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Use 24-hour format
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const currentTimeToSeconds = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Convert to total seconds for analog clock display
        return (hours * 3600) + (minutes * 60) + seconds;
    };

    // Update current time every minute when in flow mode
    useEffect(() => {
        if (flowMode) {
            // Set current time immediately
            setCurrentTime(new Date());

            // Update current time every minute
            const intervalId = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000); // every minute

            return () => clearInterval(intervalId);
        }
    }, [flowMode]);

    // Your existing helper functions remain unchanged...
    const currentActivityUsers = activeSessions.find(
        session => session.activity === activity
    )?.active_users || 0;

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const getActivityIcon = (activityType: string) => {
        switch (activityType) {
            case 'study': return '📚';
            case 'work': return '💼';
            case 'code': return '💻';
            case 'draw': return '🎨';
            default: return '🧠';
        }
    };

    const getActivityName = () => {
        return activity.charAt(0).toUpperCase() + activity.slice(1);
    };

    const getSoundName = (soundId: string) => {
        const soundObj = SOUNDS.find(s => s.id === soundId);
        return soundObj ? soundObj.name : 'Sound';
    };

    const getSoundEmoji = (soundId: string) => {
        const soundObj = SOUNDS.find(s => s.id === soundId);
        return soundObj ? soundObj.emoji : '🔊';
    };

    // Calculate progress percentage for the timer
    const progressPercentage = flowMode
        ? Math.min(100, (timeElapsed / (60 * 60)) * 100) // Scale to hourly progress for flow mode
        : 100 - (timeRemaining / duration) * 100; // Invert for completion percentage

    return (
        <div ref={containerRef} className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 overflow-hidden flex flex-col">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Confetti canvas - positioned on top */}
            <canvas
                ref={confettiCanvasRef}
                className="fixed inset-0 pointer-events-none z-[60]"
                style={{ width: '100%', height: '100%' }}
            />

            {showCelebration ? (
                // Celebration screen
                <div className="relative z-10 flex flex-col h-full items-center justify-center text-center px-6">
                    <div className="animate-bounce mb-6">
                        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl shadow-lg">
                            <Trophy className="h-12 w-12" />
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Session Complete!
                    </h1>

                    <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-8">
                        You've successfully completed your focus session.
                    </p>

                    <div className="flex flex-col items-center gap-4 mb-10 bg-neutral-100 dark:bg-neutral-800 p-6 rounded-xl w-full max-w-md">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span className="text-lg">
                                {formatTime(sessionStats.duration)} of focused time
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-6 w-6 flex items-center justify-center">
                                {getActivityIcon(sessionStats.activity)}
                            </div>
                            <span className="text-lg">
                                {getActivityName()} session
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={completeFocusSession}
                            className="px-4 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-lg transition-all w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        >
                            <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                            See progress
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Top bar with controls */}
                        <div className="flex flex-row justify-between items-center p-4 sm:p-6">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg sm:text-xl shadow-lg flex-shrink-0">
                                    {getActivityIcon(activity)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg sm:text-xl font-bold truncate">{getActivityName()} Focus</h1>
                                    {sound !== 'none' && (
                                        <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1 truncate">
                                            <Volume2 className="h-3 w-3 flex-shrink-0" /> {getSoundName(sound)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Minimize button - Updated with event parameter */}
                                <button
                                    type="button"
                                    className="p-2.5 sm:p-3 rounded-full bg-neutral-200 dark:bg-white/20 text-neutral-700 dark:text-white hover:bg-neutral-300 dark:hover:bg-white/30 transition-all flex-shrink-0"
                                    onClick={handleMinimize}
                                >
                                    <Minimize2 className="size-4.5 sm:size-5" />
                                </button>

                                {/* Close button - Updated with event parameter */}
                                <button
                                    type="button"
                                    className="p-2.5 sm:p-3 rounded-full bg-neutral-200 dark:bg-white/20 text-neutral-700 dark:text-white hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white transition-all flex-shrink-0"
                                    onClick={handleClose}
                                >
                                    <X className="size-4.5 sm:size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Main timer display - Responsive adjustments */}
                        <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-0">
                            {currentActivityUsers > 0 && (
                                <div className='flex items-center w-full justify-center'>
                                    <span className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1 ml-2">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {currentActivityUsers} {currentActivityUsers === 1 ? 'person' : 'people'} focusing now
                                    </span>
                                </div>
                            )}
                            <div className="relative mb-4 sm:mb-6">
                                {showAnalogClock ? (
                                    <div onClick={() => setShowAnalogClock(false)} className="cursor-pointer scale-75 sm:scale-100">
                                        <AnalogClock
                                            timeRemaining={flowMode ? currentTimeToSeconds(currentTime) % 43200 : timeRemaining}
                                            totalTime={flowMode ? 43200 : duration} // 12-hour cycle (12 * 60 * 60)
                                            flowMode={flowMode}
                                            isCurrentTime={flowMode}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setShowAnalogClock(true)}
                                        className="flex flex-col items-center cursor-pointer"
                                    >
                                        <div className="text-[80px] sm:text-[100px] md:text-[120px] font-bold text-center bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                            {flowMode ? formatCurrentTime(currentTime) : formatTime(timeRemaining)}
                                        </div>
                                        <div className="text-neutral-500 text-xs sm:text-sm -mt-2 sm:-mt-4">
                                            {flowMode ? "Current time" : "Time remaining"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress indicators - Show elapsed time for flow mode */}
                            <div className="w-full max-w-[280px] sm:w-80 mb-6 sm:mb-8 flex items-center justify-center px-4 sm:px-0">
                                {!flowMode && (
                                    <div className="w-full space-y-2">
                                        <div className="relative h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-full transition-all"
                                                style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                {flowMode && timeElapsed > 0 && (
                                    <div className="text-center">
                                        <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-clip-text text-transparent font-medium text-sm">
                                            In focus mode for {formatTime(timeElapsed)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Main controls - Single Stop button for flow mode, or Pause/Reset for timed sessions */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-auto px-4 sm:px-0 max-w-xs sm:max-w-md">
                                <>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={handleMinimize}
                                        className="px-4 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-md border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full sm:min-w-[180px]"
                                    >
                                        <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                        Stay in focus
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="lg"
                                        onClick={handleClose}
                                        className="px-4 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-lg transition-all w-full sm:min-w-[180px] bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        <X className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                        Finish Session
                                    </Button>
                                </>
                            </div>
                        </div>

                        {/* Bottom bar with volume control - Improved mobile layout */}
                        {sound !== 'none' && (
                            <div className="px-4 sm:p-6 flex justify-center mb-4 sm:mb-0">
                                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between sm:justify-center gap-2 sm:gap-4 shadow-md w-full max-w-sm sm:max-w-lg">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full flex-shrink-0"
                                            onClick={toggleMute}
                                        >
                                            {isMuted ?
                                                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" /> :
                                                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
                                        </Button>

                                        <Slider
                                            defaultValue={[volume]}
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={[volume]}
                                            onValueChange={(values) => setVolume(values[0])}
                                            className="min-w-[60px] flex-1 cursor-pointer"
                                            disabled={isMuted}
                                        />
                                    </div>

                                    {/* Sound selector - Always horizontal */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-white dark:bg-neutral-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
                                            >
                                                <span className="text-base sm:text-lg">{getSoundEmoji(sound)}</span>
                                                <span className="hidden sm:inline">{getSoundName(sound)}</span>
                                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 sm:w-56 p-1 sm:p-2" align="end">
                                            <div className="grid grid-cols-1 gap-1 max-h-[40vh] overflow-y-auto">
                                                {SOUNDS.map((soundOption) => (
                                                    <Button
                                                        key={soundOption.id}
                                                        variant="ghost"
                                                        className={cn(
                                                            "flex justify-start items-center text-sm h-9",
                                                            soundOption.id === sound && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                        )}
                                                        onClick={() => setSound(soundOption.id)}
                                                    >
                                                        <span className="text-lg mr-2">{soundOption.emoji}</span>
                                                        <span>{soundOption.name}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}

                        {sound === 'none' && (
                            <div className="p-4 sm:p-6 flex justify-center mb-4 sm:mb-0">
                                <Button
                                    variant="outline"
                                    className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 sm:px-6 py-3 sm:py-5 shadow-md flex items-center gap-2 text-sm"
                                    onClick={() => setSound('waves')}
                                >
                                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-1 sm:mr-2" />
                                    Add Background Sound
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}