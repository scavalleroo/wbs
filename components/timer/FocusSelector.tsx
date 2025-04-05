import { useState, useRef, useEffect } from 'react';
import { Brain, Music, Volume2, Clock, Timer, X, PlayCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';

// Sound lists
const INITIAL_SOUNDS = [
    { id: 'waves', name: 'Beach Waves', emoji: '🏝️' },
    { id: 'nature', name: 'Nature', emoji: '🌿' },
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'none', name: 'No Sound', emoji: '🔇' },
];

const ALL_SOUNDS = [
    { id: 'waves', name: 'Beach Waves', emoji: '🏝️' },
    { id: 'nature', name: 'Nature', emoji: '🌿' },
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'fireplace', name: 'Fireplace', emoji: '🔥' },
    { id: 'brown', name: 'Brown Noise', emoji: '🟤' },
    { id: 'cafe', name: 'Café Ambience', emoji: '☕' },
    { id: 'campfire', name: 'Campfire', emoji: '🏕️' },
    { id: 'waterfall', name: 'Waterfall', emoji: '🌊' },
    { id: 'heater', name: 'Heater', emoji: '🔌' },
    { id: 'none', name: 'No Sound', emoji: '🔇' },
];

const ACTIVITIES = [
    { id: 'study', name: 'Study', emoji: '📚' },
    { id: 'work', name: 'Work', emoji: '💼' },
    { id: 'code', name: 'Code', emoji: '💻' },
    { id: 'draw', name: 'Draw', emoji: '🎨' },
    { id: 'focus', name: 'Focus', emoji: '🧠' },
];

interface FocusSelectorProps {
    onStart: (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => void;
    onClose: () => void;
}

export function FocusSelector({ onStart, onClose }: FocusSelectorProps) {
    const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0].id);
    const [selectedSound, setSelectedSound] = useState(INITIAL_SOUNDS[0].id);
    const [duration, setDuration] = useState(25);
    const [volume, setVolume] = useState(50);
    const [timerMode, setTimerMode] = useState<'timed' | 'flow'>('flow');
    const [showAllSounds, setShowAllSounds] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedMinute, setSelectedMinute] = useState(25);

    const SOUNDS = showAllSounds ? ALL_SOUNDS : INITIAL_SOUNDS;

    // Handle time input changes
    useEffect(() => {
        const newDuration = (selectedHour * 60) + selectedMinute;
        setDuration(newDuration);
    }, [selectedHour, selectedMinute]);

    // Update hours and minutes when duration changes directly
    useEffect(() => {
        setSelectedHour(Math.floor(duration / 60));
        setSelectedMinute(duration % 60);
    }, [duration]);

    // Check if mobile on mount and on resize
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    const handleStart = () => {
        onStart({
            activity: selectedActivity,
            sound: selectedSound === 'none' ? 'none' : selectedSound,
            duration: timerMode === 'timed' ? duration : 0,
            volume: volume,
            flowMode: timerMode === 'flow'
        });
    };

    // Generate minutes options for the wheel
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const hours = Array.from({ length: 9 }, (_, i) => i); // 0-8 hours

    // Handle increment/decrement for hour
    const incrementHour = () => {
        setSelectedHour(prev => Math.min(8, prev + 1));
    };

    const decrementHour = () => {
        setSelectedHour(prev => Math.max(0, prev - 1));
    };

    // Handle increment/decrement for minutes
    const incrementMinute = () => {
        const currentIndex = minutes.indexOf(selectedMinute);
        if (currentIndex < minutes.length - 1) {
            setSelectedMinute(minutes[currentIndex + 1]);
        } else if (selectedHour < 8) {
            // Roll over to next hour if possible
            setSelectedHour(prev => prev + 1);
            setSelectedMinute(minutes[0]);
        }
    };

    const decrementMinute = () => {
        const currentIndex = minutes.indexOf(selectedMinute);
        if (currentIndex > 0) {
            setSelectedMinute(minutes[currentIndex - 1]);
        } else if (selectedHour > 0) {
            // Roll back to previous hour if possible
            setSelectedHour(prev => prev - 1);
            setSelectedMinute(minutes[minutes.length - 1]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden">
            <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex flex-col h-full w-full">
                {/* Background gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                {/* Content wrapper - fixed layout with header, scrollable content, and footer */}
                <div className="relative z-10 flex flex-col h-full w-full">
                    {/* Fixed Header */}
                    <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg sm:text-xl font-bold">New Focus Session</h1>
                        </div>
                        <button
                            type="button"
                            className="p-2.5 sm:p-3 rounded-full bg-neutral-200 dark:bg-white/20 text-neutral-700 dark:text-white hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white transition-all flex-shrink-0"
                            onClick={onClose}
                        >
                            <X className="size-4.5 sm:size-5" />
                        </button>
                    </div>

                    {/* Scrollable Content Area with max-width */}
                    <div className="flex-grow overflow-auto">
                        <div className="max-w-screen-lg mx-auto p-4 sm:p-6 space-y-12">
                            {/* Activity Selection */}
                            <div>
                                <h2 className="text-sm font-medium mb-3 flex items-center">
                                    <Brain className="mr-2 h-4 w-4 text-indigo-500" />
                                    Activity
                                </h2>
                                <div className="grid grid-cols-5 gap-2">
                                    {ACTIVITIES.map((activity) => (
                                        <button
                                            key={activity.id}
                                            className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all 
                                            ${selectedActivity === activity.id
                                                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                                }`}
                                            onClick={() => setSelectedActivity(activity.id)}
                                        >
                                            <span className="text-xl sm:text-2xl mb-1">{activity.emoji}</span>
                                            <span className="text-xs font-medium">{activity.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sound Selection - with scrollable area when showing all sounds */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-medium flex items-center">
                                        <Music className="mr-2 h-4 w-4 text-indigo-500" />
                                        Background Sound
                                    </h2>
                                    <button
                                        onClick={() => setShowAllSounds(!showAllSounds)}
                                        className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        {showAllSounds ? "Show Less" : "Show More"}
                                    </button>
                                </div>

                                {/* Sounds container - scrollable when showing all sounds */}
                                <div className={cn(
                                    "space-y-3"
                                )}>
                                    {/* Sound options */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {SOUNDS.map((sound) => (
                                            <button
                                                key={sound.id}
                                                onClick={() => setSelectedSound(sound.id)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all 
                                                ${selectedSound === sound.id
                                                        ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                                    }`}
                                            >
                                                <span className="text-xl mb-1">{sound.emoji}</span>
                                                <span className="text-xs font-medium">{sound.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Volume slider - only show if sound is selected, more compact on desktop */}
                                    {selectedSound !== 'none' && (
                                        <div className={cn(
                                            "flex items-center",
                                            isMobile ? "gap-3" : "justify-end gap-2"
                                        )}>
                                            <Volume2 className="h-4 w-4 text-neutral-400" />
                                            <Slider
                                                defaultValue={[volume]}
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[volume]}
                                                onValueChange={(values) => setVolume(values[0])}
                                                className={cn("cursor-pointer", isMobile ? "w-full" : "w-32")}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timer Selection - Time wheel only */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-medium flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-indigo-500" />
                                        Duration
                                    </h2>
                                    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                                        <button
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${timerMode === 'timed'
                                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm'
                                                : 'text-neutral-600 dark:text-neutral-300'
                                                }`}
                                            onClick={() => setTimerMode('timed')}
                                        >
                                            Timed
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${timerMode === 'flow'
                                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm'
                                                : 'text-neutral-600 dark:text-neutral-300'
                                                }`}
                                            onClick={() => setTimerMode('flow')}
                                        >
                                            Flow
                                        </button>
                                    </div>
                                </div>

                                {timerMode === 'timed' ? (
                                    <div>
                                        {/* Time wheel from SiteTimeControls */}
                                        <div className="flex items-center justify-center space-x-1 max-w-[280px] mx-auto">
                                            <div className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 sm:p-3 shadow-inner w-full">
                                                {/* Hour Control */}
                                                <div className="flex flex-col items-center">
                                                    {/* Up arrow */}
                                                    <button
                                                        onClick={incrementHour}
                                                        className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                                                        disabled={selectedHour >= 8}
                                                        aria-label="Increase hours"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Hours Display */}
                                                    <div className="relative w-12 sm:w-16 h-10 flex items-center justify-center overflow-hidden">
                                                        <div className="wheel-display">
                                                            {hours.map(hour => (
                                                                <div
                                                                    key={hour}
                                                                    className={`absolute left-0 right-0 flex justify-center transition-all duration-200 ${selectedHour === hour
                                                                        ? 'opacity-100 transform-none font-bold text-xl text-blue-600 dark:text-blue-400'
                                                                        : selectedHour === hour - 1
                                                                            ? 'opacity-60 -translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                                            : selectedHour === hour + 1
                                                                                ? 'opacity-60 translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                                                : 'opacity-0 text-neutral-400'
                                                                        }`}
                                                                    onClick={() => {
                                                                        setSelectedHour(hour);
                                                                    }}
                                                                >
                                                                    {hour}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Down arrow */}
                                                    <button
                                                        onClick={decrementHour}
                                                        className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                                                        disabled={selectedHour <= 0}
                                                        aria-label="Decrease hours"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="text-lg font-medium mx-1 sm:mx-2 text-neutral-800 dark:text-neutral-200">h</div>

                                                {/* Minutes Control */}
                                                <div className="flex flex-col items-center">
                                                    {/* Up arrow */}
                                                    <button
                                                        onClick={incrementMinute}
                                                        className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                                                        disabled={selectedHour >= 8 && minutes.indexOf(selectedMinute) === minutes.length - 1}
                                                        aria-label="Increase minutes"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Minutes Display */}
                                                    <div className="relative w-16 h-10 flex items-center justify-center overflow-hidden">
                                                        <div className="wheel-display">
                                                            {minutes.map(minute => {
                                                                const currentIndex = minutes.indexOf(selectedMinute);
                                                                const minuteIndex = minutes.indexOf(minute);
                                                                const isVisible = Math.abs(currentIndex - minuteIndex) <= 1;

                                                                return (
                                                                    <div
                                                                        key={minute}
                                                                        className={`absolute left-0 right-0 flex justify-center transition-all duration-200 ${selectedMinute === minute
                                                                            ? 'opacity-100 transform-none font-bold text-xl text-blue-600 dark:text-blue-400'
                                                                            : currentIndex === minuteIndex - 1
                                                                                ? 'opacity-60 -translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                                                : currentIndex === minuteIndex + 1
                                                                                    ? 'opacity-60 translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                                                    : 'opacity-0 text-neutral-400'
                                                                            }`}
                                                                        onClick={() => {
                                                                            setSelectedMinute(minute);
                                                                        }}
                                                                    >
                                                                        {minute.toString().padStart(2, '0')}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Down arrow */}
                                                    <button
                                                        onClick={decrementMinute}
                                                        className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                                                        disabled={selectedHour <= 0 && selectedMinute <= 0}
                                                        aria-label="Decrease minutes"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="text-lg font-medium mx-1 sm:mx-2 text-neutral-800 dark:text-neutral-200">m</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full rounded-2xl p-5 overflow-hidden bg-gradient-to-r from-[#A0E9FF] via-[#7189FF] to-[#4C4CFF] shadow-[0_0_15px_rgba(76,76,255,0.3)]">
                                        {/* Semi-transparent dark overlay for better text contrast */}
                                        <div className="absolute inset-0 bg-black/30 z-0"></div>

                                        {/* Decorative circles */}
                                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 rounded-full bg-white/10 -mr-32 z-0"></div>
                                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 rounded-full bg-white/10 -mr-24 z-0"></div>
                                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10 -mr-16 z-0"></div>

                                        <div className="relative z-10 text-center">
                                            <h3 className="text-xl font-bold text-white mb-2">Flow Mode</h3>
                                            <p className="text-white text-sm">
                                                Open-ended session with no time limit. Focus for as long as you need and track your progress.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer with Start Button */}
                    <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
                        <Button
                            className={cn(
                                "px-10 sm:px-16 py-8 sm:py-9 text-xl sm:text-2xl font-medium rounded-full shadow-xl transition-all",
                                "bg-gradient-to-r from-orange-500 via-pink-500 to-rose-600 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-700 hover:shadow-2xl"
                            )}
                            onClick={handleStart}
                        >
                            Start Focus Session
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}