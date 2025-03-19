import { useState } from 'react';
import { Book, Briefcase, Code, PenTool, Brain, Music, Volume2, VolumeX, Clock, Timer } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { SocialIcon } from 'react-social-icons';

const ACTIVITIES = [
    { id: 'study', name: 'Study', emoji: '📚' },
    { id: 'work', name: 'Work', emoji: '💼' },
    { id: 'code', name: 'Code', emoji: '💻' },
    { id: 'draw', name: 'Draw', emoji: '🎨' },
    { id: 'focus', name: 'Focus', emoji: '🧠' },
];

const SOUNDS = [
    { id: 'lofi', name: 'Lo-Fi Radio', src: '/sounds/radios/lofi.mp3', emoji: '🎧' },
    { id: 'nature', name: 'Nature Sounds', src: '/sounds/radios/nature.mp3', emoji: '🌿' },
    { id: 'rain', name: 'Rain', src: '/sounds/radios/rain.mp3', emoji: '🌧️' },
    { id: 'cafe', name: 'Café Ambience', src: '/sounds/radios/cafe.mp3', emoji: '☕' },
    { id: 'none', name: 'No Sound', src: '', emoji: '🔇' },
];

interface FocusSelectorProps {
    onStart: (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => void;
}

export function FocusSelector({ onStart }: FocusSelectorProps) {
    const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0].id);
    const [selectedSound, setSelectedSound] = useState(SOUNDS[0].id);
    const [duration, setDuration] = useState(25); // minutes
    const [volume, setVolume] = useState(50); // 0-100
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [timerMode, setTimerMode] = useState<'timed' | 'flow'>('flow');

    const handleStart = () => {
        onStart({
            activity: selectedActivity,
            sound: soundEnabled ? selectedSound : 'none',
            duration: timerMode === 'timed' ? duration : 0, // 0 indicates flow mode
            volume: volume,
            flowMode: timerMode === 'flow'
        });
    };

    const presetTimes = [5, 15, 25, 45, 60];

    return (
        <div className="overflow-hidden">
            <div className="p-6 space-y-6">
                {/* Activity Selection */}
                <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-indigo-500" />
                        Choose your activity
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                        {ACTIVITIES.map((activity) => {
                            // Remove this line since we're not using icon components anymore
                            // const Icon = activity.icon;
                            return (
                                <button
                                    key={activity.id}
                                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all 
            ${selectedActivity === activity.id
                                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                    onClick={() => setSelectedActivity(activity.id)}
                                >
                                    {/* Replace the Icon component with the emoji */}
                                    <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">{activity.emoji}</span>
                                    <span className="text-xs sm:text-sm font-medium">{activity.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Selection */}
                <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-indigo-500" />
                        Set duration
                    </h3>

                    {/* Timer mode selection */}
                    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-4">
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${timerMode === 'timed'
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                            onClick={() => setTimerMode('timed')}
                        >
                            Timed Session
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${timerMode === 'flow'
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                            onClick={() => setTimerMode('flow')}
                        >
                            Go with the Flow
                        </button>
                    </div>

                    {timerMode === 'timed' ? (
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-3 sm:p-4 rounded-xl">
                            {/* Digital time display */}
                            <div className="flex justify-center mb-4 sm:mb-6">
                                <div className="text-3xl sm:text-4xl font-bold text-center bg-white dark:bg-neutral-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-inner">
                                    {duration} <span className="text-lg sm:text-xl text-neutral-400">min</span>
                                </div>
                            </div>

                            {/* Time setter slider */}
                            <div className="space-y-3 sm:space-y-4">
                                <Slider
                                    defaultValue={[duration]}
                                    min={1}
                                    max={120}
                                    step={1}
                                    value={[duration]}
                                    onValueChange={(values) => setDuration(values[0])}
                                    className="cursor-pointer"
                                />

                                <div className="flex justify-between text-xs text-neutral-500">
                                    <span>1m</span>
                                    <span>30m</span>
                                    <span>60m</span>
                                    <span>120m</span>
                                </div>

                                {/* Time presets */}
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 sm:mt-4">
                                    {presetTimes.map((time) => (
                                        <button
                                            key={time}
                                            className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all 
                            ${duration === time
                                                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500'
                                                }`}
                                            onClick={() => setDuration(time)}
                                        >
                                            {time} min
                                        </button>
                                    ))}
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={120}
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                                            className="w-full text-sm bg-white dark:bg-neutral-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 sm:p-6 rounded-xl">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-full p-3 mb-4">
                                    <Timer className="h-8 w-8" />
                                </div>
                                <h4 className="text-lg font-medium mb-2">Open-ended Focus Session</h4>
                                <p className="text-neutral-500 mb-3">
                                    Perfect for when you want to focus without time constraints.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sound Selection */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <Music className="mr-2 h-5 w-5 text-indigo-500" />
                            Background sound
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                        >
                            {soundEnabled ? (
                                <>
                                    <Volume2 className="h-4 w-4" />
                                    <span>Enabled</span>
                                </>
                            ) : (
                                <>
                                    <VolumeX className="h-4 w-4" />
                                    <span>Disabled</span>
                                </>
                            )}
                        </Button>
                    </div>

                    <div className={`space-y-4 ${soundEnabled ? "" : "opacity-50 pointer-events-none"}`}>
                        {/* Sound options */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {SOUNDS.map((sound) => (
                                <button
                                    key={sound.id}
                                    onClick={() => setSelectedSound(sound.id)}
                                    disabled={!soundEnabled}
                                    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all 
                ${selectedSound === sound.id && soundEnabled
                                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                >
                                    <span className="text-xl sm:text-2xl mb-1">{sound.emoji}</span>
                                    <span className="text-xs sm:text-sm font-medium text-center">{sound.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        {/* <div className="flex items-center my-3">
                            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
                            <span className="mx-2 text-xs text-neutral-400">or</span>
                            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700"></div>
                        </div> */}

                        {/* Spotify connect button */}
                        {/* <div>
                            <button
                                className="flex items-center justify-center w-auto mx-auto bg-[#1DB954] hover:bg-[#1AA34A] text-white px-4 py-1.5 rounded-lg text-base font-medium transition-all"
                                disabled={!soundEnabled}
                            >
                                <SocialIcon
                                    network="spotify"
                                    style={{ height: 28, width: 28 }}
                                    className="mr-2"
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                                Connect with Spotify
                            </button>
                        </div> */}

                        <div className="flex items-center gap-3 pt-2">
                            <Volume2 className="h-5 w-5 text-neutral-400" />
                            <Slider
                                defaultValue={[volume]}
                                min={0}
                                max={100}
                                step={1}
                                value={[volume]}
                                onValueChange={(values) => setVolume(values[0])}
                                className="cursor-pointer"
                                disabled={!soundEnabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-6 text-lg font-medium"
                    size="lg"
                    onClick={handleStart}
                >
                    Start Focus Session
                </Button>
            </div>
        </div>
    );
}