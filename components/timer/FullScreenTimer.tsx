import { useState } from 'react';
import { Play, Pause, Minimize2, X, Volume2, VolumeX, RefreshCw, Music, ChevronDown } from 'lucide-react';
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

// Sound options remain the same
const SOUNDS = [
    { id: 'waves', name: 'Ocean Waves', emoji: '🌊' },
    { id: 'nature', name: 'Nature Sounds', emoji: '🌿' },
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'fireplace', name: 'Fireplace', emoji: '🔥' },
    { id: 'white', name: 'White Noise', emoji: '⚪' },
    { id: 'brown', name: 'Brown Noise', emoji: '🟤' },
    { id: 'cafe', name: 'Café Ambience', emoji: '☕' },
    { id: 'none', name: 'No Sound', emoji: '🔇' },
];

interface FullScreenTimerProps {
    onClose: () => void;
    onMinimize: () => void;
}

export function FullScreenTimer({ onClose, onMinimize }: FullScreenTimerProps) {
    // Get all timer state from context instead of local state
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
        resetTimer
    } = useTimer();

    // Local UI state only (not timer state)
    const [showAnalogClock, setShowAnalogClock] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 overflow-hidden flex flex-col">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Top bar with controls - Made responsive */}
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

                    {/* Minimize button - Always on right */}
                    <button
                        className="p-1.5 sm:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all ml-2 flex-shrink-0"
                        onClick={onMinimize}
                    >
                        <Minimize2 className="size-3.5 sm:size-5" />
                    </button>
                </div>

                {/* Main timer display - Responsive adjustments */}
                <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-0">
                    <div className="relative mb-4 sm:mb-6">
                        {showAnalogClock ? (
                            <div onClick={() => setShowAnalogClock(false)} className="cursor-pointer scale-75 sm:scale-100">
                                <AnalogClock
                                    timeRemaining={flowMode ? timeElapsed : timeRemaining}
                                    totalTime={flowMode ? 3600 : duration}
                                    flowMode={flowMode}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowAnalogClock(true)}
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <div className="text-[80px] sm:text-[100px] md:text-[120px] font-bold text-center bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                    {flowMode ? formatTime(timeElapsed) : formatTime(timeRemaining)}
                                </div>
                                <div className="text-neutral-500 text-xs sm:text-sm -mt-2 sm:-mt-4">
                                    {flowMode ? "Time elapsed" : "Time remaining"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress indicators - Responsive width */}
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
                                    {Math.floor(timeElapsed / 60)} minutes focused
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Main controls - Responsive layout */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-auto px-4 sm:px-0 max-w-xs sm:max-w-md">
                        <Button
                            variant={isRunning ? "default" : "default"}
                            size="lg"
                            onClick={togglePlayPause}
                            className={cn(
                                "px-4 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-lg transition-all w-full sm:min-w-[160px]",
                                isRunning
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                            )}
                        >
                            {isRunning ? <Pause className="h-5 w-5 sm:h-6 sm:w-6 mr-2" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />}
                            {isRunning ? "Pause" : "Resume"}
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={resetTimer}
                            className="px-4 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-md border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full sm:min-w-[160px]"
                        >
                            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                            Reset
                        </Button>
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
        </div>
    );
}