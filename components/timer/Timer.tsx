"use client";

import { Pause, Play, TimerIcon, X } from 'lucide-react';
import { createContext, useContext, useState, ReactNode, useEffect, ChangeEvent } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface TimerContextProps {
    time: number | null;
    isRunning: boolean;
    initialTime: number;
    formatTime(seconds: number | null): string;
    setTime(time: any): void;
    toggleIsRunning: () => void;
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
    const [initialTime, setInitialTime] = useState<number>(10.2 * 60);
    const [time, setTime] = useState<number | null>(null); // Start with null to represent uninitialized
    const [isRunning, setIsRunning] = useState<boolean>(false);

    const toggleIsRunning = () => {
        // Don't start the timer if it's not set yet
        if (time === null && !isRunning) {
            return;
        }

        // Initialize the timer if it's null when trying to start
        if (time === null) {
            setTime(initialTime);
        }

        // logCustomEvent('toggleIsRunning', { isRunning: !isRunning });
        setIsRunning((prev) => !prev);
    };

    // Format the time as mm:ss or --:-- if null
    const formatTime = (seconds: number | null): string => {
        if (seconds === null) {
            return "--:--";
        }

        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <TimerContext.Provider value={{ time, isRunning, initialTime, formatTime, toggleIsRunning, setTime }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};

export function Timer() {
    const { time, isRunning, formatTime, toggleIsRunning, setTime } = useTimer();
    const [selectedAlarm, setSelectedAlarm] = useState('timer-1');
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    const playAlarm = () => {
        // logCustomEvent('timer_alarm_played', { time: time });
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio.play();
        }
    };

    useEffect(() => {
        if (!currentAudio) {
            setCurrentAudio(new Audio(`/sounds/${selectedAlarm}.mp3`));
        }

        let timerInterval: NodeJS.Timeout | undefined;
        if (isRunning && time !== null) {
            timerInterval = setInterval(() => {
                setTime((prevTime: number | null) => {
                    if (prevTime === null) return null;
                    return Math.max(prevTime - 1, 0);
                });
            }, 1000);
        } else {
            if (timerInterval)
                clearInterval(timerInterval);
        }

        return () => clearInterval(timerInterval);
    }, [isRunning, currentAudio]);

    useEffect(() => {
        if (time === 0) {
            toggleIsRunning();
            playAlarm();
        }
    }, [time]);

    const handleAddMinutes = (): void => {
        // logCustomEvent('handleAddMinutes', { time: time });
        // Initialize the timer if it's not set yet
        if (time === null) {
            setTime(60); // Start with 1 minute
        } else {
            setTime((prevTime: number | null) => prevTime !== null ? prevTime + 60 : 60);
        }
    };

    const handleSubtractMinutes = (): void => {
        // logCustomEvent('handleSubtractMinutes', { time: time });
        if (time === null) return; // Do nothing if timer isn't set
        setTime((prevTime: number | null) => prevTime !== null ? Math.max(prevTime - 60, 0) : null);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace(/[^0-9:]/g, '');

        // Handle the case when user is typing from --:--
        if (value === "") {
            setTime(null);
            e.target.value = "--:--";
            return;
        }

        const parts = value.split(':');
        let minutes = parts[0] || '';
        let seconds = parts[1] || '';

        if (minutes.length > 2) minutes = minutes.slice(0, 2);
        if (seconds.length > 2) seconds = seconds.slice(0, 2);

        const formattedValue = `${minutes}:${seconds}`;
        e.target.value = formattedValue;

        const totalSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
        setTime(totalSeconds);
        // logCustomEvent('handleInputChange', { time: totalSeconds });
    };

    // Handle clicking preset buttons to set a specific time
    const setPresetTime = (minutes: number) => {
        setTime(minutes * 60);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="relative px-1 sm:px-3 py-1 h-full bg-muted rounded-sm flex flex-row items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground">
                    <TimerIcon className="size-6 shrink-0 sm:block" />
                    <p className='relative text-lg tabular-nums w-full text-center'>
                        {formatTime(time)}
                    </p>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <div className="flex flex-col items-center">
                    <div className="flex flex-row justify-between items-center w-full border-b border-muted px-4 py-2">
                        <span className="font-bold">Timer</span>
                    </div>
                    <div className="flex flex-col items-center w-full my-2">
                        <span className="text-xs text-muted-foreground mb-2">Default timers</span>
                        <div className="flex justify-center items-center gap-2 w-full">
                            <Button onClick={() => setPresetTime(25)} variant={'secondary'} disabled={isRunning} className="px-4 text-xs">
                                25 min
                            </Button>
                            <Button onClick={() => setPresetTime(15)} variant={'secondary'} disabled={isRunning} className="px-4 text-xs">
                                15 min
                            </Button>
                            <Button onClick={() => setPresetTime(5)} variant={'secondary'} disabled={isRunning} className="px-4 text-xs">
                                5 min
                            </Button>
                        </div>
                    </div>
                    <div className="text-6xl text-center rounded-lg py-2 mb-4 mx-4 border border-muted tabular-nums w-[200px]">
                        <input
                            type="text"
                            value={formatTime(time)}
                            onChange={handleInputChange}
                            className="bg-transparent text-center w-full"
                            maxLength={5}
                            disabled={isRunning}
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                            minutes : seconds
                        </div>
                    </div>
                    <div className="flex flex-col items-center w-full px-4 mb-4">
                        <span className="text-xs text-muted-foreground mb-2">Choose timer sound</span>
                        <div className="flex items-center gap-2 w-full">
                            <Select defaultValue="timer-1" onValueChange={(value) => {
                                setSelectedAlarm(value);
                                setCurrentAudio(new Audio(`/sounds/${value}.mp3`));
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the alarm" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Alarm</SelectLabel>
                                        <SelectItem value="timer-1">Timer 1</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button onClick={playAlarm} variant={'secondary'} className="p-2">
                                <Play className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-center items-center gap-4 w-full mb-2">
                        <Button onClick={handleAddMinutes} variant={'secondary'} className="px-4 text-xs">
                            +1 min
                        </Button>
                        <button
                            onClick={() => {
                                // If timer isn't set yet, set to default time when play is pressed
                                if (time === null && !isRunning) {
                                    setTime(10.2 * 60); // Set to default time
                                }

                                toggleIsRunning();

                                if (!isRunning) {
                                    const startAudio = new Audio('/sounds/lock.mp3');
                                    startAudio.play();
                                } else {
                                    const startAudio = new Audio('/sounds/woosh.mp3');
                                    startAudio.play();
                                }
                            }}
                            className="p-2 rounded-full bg-primary text-primary-foreground"
                            disabled={isRunning && time === null}
                        >
                            {isRunning ? <Pause className="size-7" /> : <Play className="size-7" />}
                        </button>
                        <Button
                            onClick={handleSubtractMinutes}
                            variant={'secondary'}
                            className="px-4 text-xs"
                            disabled={time === null}
                        >
                            -1 min
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}