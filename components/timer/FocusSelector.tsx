import { useState } from 'react';
import { Book, Briefcase, Code, PenTool, Brain, Music, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';

const ACTIVITIES = [
    { id: 'study', name: 'Study', icon: Book },
    { id: 'work', name: 'Work', icon: Briefcase },
    { id: 'code', name: 'Code', icon: Code },
    { id: 'draw', name: 'Draw', icon: PenTool },
    { id: 'focus', name: 'Focus', icon: Brain },
];

const SOUNDS = [
    { id: 'lofi', name: 'Lo-Fi Radio', src: '/sounds/radios/lofi.mp3' },
    { id: 'nature', name: 'Nature Sounds', src: '/sounds/radios/nature.mp3' },
    { id: 'rain', name: 'Rain', src: '/sounds/radios/rain.mp3' },
    { id: 'cafe', name: 'Café Ambience', src: '/sounds/radios/cafe.mp3' },
    { id: 'none', name: 'No Sound', src: '' },
];

interface FocusSelectorProps {
    onStart: (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
    }) => void;
}

export function FocusSelector({ onStart }: FocusSelectorProps) {
    const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0].id);
    const [selectedSound, setSelectedSound] = useState(SOUNDS[0].id);
    const [duration, setDuration] = useState(25); // minutes
    const [volume, setVolume] = useState(50); // 0-100
    const [soundEnabled, setSoundEnabled] = useState(true);

    const handleStart = () => {
        onStart({
            activity: selectedActivity,
            sound: soundEnabled ? selectedSound : 'none',
            duration: duration,
            volume: volume
        });
    };

    const presetTimes = [5, 15, 25, 45, 60];

    return (
        <div className="overflow-auto">
            <div className="p-6 space-y-6">
                {/* Activity Selection */}
                <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-indigo-500" />
                        Choose your activity
                    </h3>
                    <div className="grid grid-cols-5 gap-3">
                        {ACTIVITIES.map((activity) => {
                            const Icon = activity.icon;
                            return (
                                <button
                                    key={activity.id}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all 
                    ${selectedActivity === activity.id
                                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                    onClick={() => setSelectedActivity(activity.id)}
                                >
                                    <Icon className="h-6 w-6 mb-2" />
                                    <span className="text-sm font-medium">{activity.name}</span>
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

                    <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl">
                        {/* Digital time display */}
                        <div className="flex justify-center mb-6">
                            <div className="text-4xl font-bold text-center bg-white dark:bg-neutral-700 px-6 py-3 rounded-lg shadow-inner">
                                {duration} <span className="text-xl text-gray-400">min</span>
                            </div>
                        </div>

                        {/* Time setter slider */}
                        <div className="space-y-4">
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
                                <span>1 min</span>
                                <span>30 min</span>
                                <span>60 min</span>
                                <span>120 min</span>
                            </div>

                            {/* Time presets */}
                            <div className="flex flex-wrap gap-2 justify-between mt-4">
                                {presetTimes.map((time) => (
                                    <button
                                        key={time}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all 
                      ${duration === time
                                                ? 'bg-indigo-500 text-white'
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
                                        className="w-20 text-sm bg-white dark:bg-neutral-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {SOUNDS.map((sound) => (
                                <button
                                    key={sound.id}
                                    onClick={() => setSelectedSound(sound.id)}
                                    disabled={!soundEnabled}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all 
                    ${selectedSound === sound.id && soundEnabled
                                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                >
                                    {sound.name}
                                </button>
                            ))}
                        </div>

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
                            {/* <span className="text-sm w-8">{volume}%</span> */}
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