'use client';

import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Play, Timer, Clock, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/contexts/TimerProvider';
import { useUserGoals } from '@/hooks/use-user-goals';
import { User } from '@supabase/supabase-js';

interface OptimizedFocusTimeCardProps {
    user: User | null | undefined;
    isTimerActive: boolean;
    getTimerStatusText: () => string;
    formatMinutesToHoursMinutes: (minutes: number) => string;
    onStartFocusClick: () => void;
    onResumeFocusClick: () => void;
    isMobile?: boolean;
}

export function OptimizedFocusTimeCard({
    user,
    isTimerActive,
    getTimerStatusText,
    formatMinutesToHoursMinutes,
    onStartFocusClick,
    onResumeFocusClick,
    isMobile = false
}: OptimizedFocusTimeCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [todayProgress, setTodayProgress] = useState<any>(null);
    const [isEditingFocusGoal, setIsEditingFocusGoal] = useState(false);
    const [editableFocusGoal, setEditableFocusGoal] = useState(120);

    const { getTodayProgress, updateGoal } = useUserGoals({ user });
    const { timeRemaining, timeElapsed, flowMode, isRunning } = useTimer();

    useEffect(() => {
        const loadFocusData = async () => {
            if (!user) return;
            setIsLoading(true);
            const progress = await getTodayProgress();
            if (progress) {
                setTodayProgress(progress);
                setEditableFocusGoal(progress.focusGoalMinutes);
            }
            setIsLoading(false);
        };
        loadFocusData();
    }, [user, getTodayProgress]);

    useEffect(() => {
        if (todayProgress) {
            getTodayProgress().then(progress => {
                if (progress) setTodayProgress(progress);
            });
        }
    }, [timeRemaining, timeElapsed, isRunning, flowMode, getTodayProgress, todayProgress]);

    const onEditGoal = () => {
        if (todayProgress) {
            setEditableFocusGoal(todayProgress.focusGoalMinutes);
        }
        setIsEditingFocusGoal(true);
    };

    const onSaveGoal = async () => {
        if (!todayProgress) return;
        setIsLoading(true);
        const result = await updateGoal(todayProgress.goalId, {
            focus_time_minutes: editableFocusGoal
        });
        if (result) {
            const progress = await getTodayProgress();
            if (progress) setTodayProgress(progress);
        }
        setIsEditingFocusGoal(false);
        setIsLoading(false);
    };

    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedMinute, setSelectedMinute] = useState(0);

    useEffect(() => {
        if (isEditingFocusGoal) {
            const initialHours = Math.floor(editableFocusGoal / 60);
            const initialMinutes = editableFocusGoal % 60;
            setSelectedHour(Math.min(8, initialHours));
            setSelectedMinute(initialHours >= 8 ? 0 : initialMinutes);
        }
    }, [isEditingFocusGoal, editableFocusGoal]);

    useEffect(() => {
        if (isEditingFocusGoal) {
            const totalMinutes = (selectedHour * 60) + selectedMinute;
            setEditableFocusGoal(Math.max(1, totalMinutes));
        }
    }, [selectedHour, selectedMinute, isEditingFocusGoal]);

    const getProgressPercentage = () => {
        if (isLoading || !todayProgress) return 0;
        const { focusActualMinutes, focusGoalMinutes } = todayProgress;
        if (focusGoalMinutes <= 0) return 0;
        return Math.min(100, Math.round((focusActualMinutes / focusGoalMinutes) * 100));
    };

    const getFocusTimeDisplay = () => {
        if (isLoading || !todayProgress) return { actual: '0m', goal: formatMinutesToHoursMinutes(editableFocusGoal) };
        const { focusActualMinutes, focusGoalMinutes } = todayProgress;
        return {
            actual: formatMinutesToHoursMinutes(focusActualMinutes || 0),
            goal: formatMinutesToHoursMinutes(focusGoalMinutes || 120)
        };
    };

    const incrementHour = () => {
        setSelectedHour(prev => {
            const nextHour = Math.min(8, prev + 1);
            if (nextHour === 8) setSelectedMinute(0);
            return nextHour;
        });
    };

    const decrementHour = () => setSelectedHour(prev => Math.max(0, prev - 1));

    const incrementMinute = () => {
        if (selectedHour >= 8) return;
        const currentTotalMinutes = (selectedHour * 60) + selectedMinute;
        let nextTotalMinutes = currentTotalMinutes + 5;
        if (nextTotalMinutes > 480) nextTotalMinutes = 480;
        setSelectedHour(Math.floor(nextTotalMinutes / 60));
        setSelectedMinute(nextTotalMinutes % 60);
    };

    const decrementMinute = () => {
        const currentTotalMinutes = (selectedHour * 60) + selectedMinute;
        let nextTotalMinutes = currentTotalMinutes - 5;
        if (nextTotalMinutes < 0) nextTotalMinutes = 0;
        setSelectedHour(Math.floor(nextTotalMinutes / 60));
        setSelectedMinute(nextTotalMinutes % 60);
    };

    const { actual, goal } = getFocusTimeDisplay();

    const TimeEditor = () => (
        <div className="flex flex-col items-center bg-black/30 dark:bg-black/40 rounded-lg p-3 shadow-md backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-1 mb-3 w-full">
                <div className="flex flex-col items-center">
                    <button onClick={incrementHour} className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50" disabled={selectedHour >= 8}>
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                        <span className="font-bold text-lg text-white">{selectedHour}</span>
                    </div>
                    <button onClick={decrementHour} className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50" disabled={selectedHour <= 0}>
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>
                <div className="text-sm font-medium mx-1 text-white">h</div>
                <div className="flex flex-col items-center">
                    <button onClick={incrementMinute} className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50" disabled={selectedHour >= 8}>
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                        <span className="font-bold text-lg text-white">{selectedMinute.toString().padStart(2, '0')}</span>
                    </div>
                    <button onClick={decrementMinute} className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50" disabled={selectedHour <= 0 && selectedMinute <= 0}>
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>
                <div className="text-sm font-medium mx-1 text-white">m</div>
            </div>
            <Button onClick={onSaveGoal} size="sm" className="w-full bg-white/20 hover:bg-white/30 border-none text-white font-medium" disabled={(selectedHour * 60) + selectedMinute === 0 || isLoading}>
                {isLoading ? 'Saving...' : 'Save Goal'}
            </Button>
        </div>
    );

    if (isLoading && !todayProgress) {
        return (
            <div className="rounded-xl p-3 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 text-white flex items-center justify-center min-h-[180px]">
                <p>Loading Focus Data...</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="rounded-xl p-3 bg-gradient-to-r from-blue-400 to-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 z-0 opacity-50"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0 opacity-50"></div>
                <div className="absolute inset-0 bg-black/20 z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center">
                        <div className="mr-2 flex-shrink-0">
                            <div className="w-14 h-14">
                                <CircularProgressbar value={getProgressPercentage()} text={`${getProgressPercentage()}%`} strokeWidth={10} styles={buildStyles({ textSize: '24px', pathColor: '#ffffff', textColor: '#ffffff', trailColor: 'rgba(255,255,255,0.2)' })} />
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h2 className="font-bold flex items-center text-sm"><Clock className="mr-1.5 h-3.5 w-3.5" /> Focus Time</h2>
                            <div className="flex items-baseline mt-1">
                                <span className="text-xl font-bold">{actual}</span>
                                <span className="ml-1 text-xs opacity-80">of {goal} goal</span>
                                {!isEditingFocusGoal ? (
                                    <Button onClick={onEditGoal} size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0 text-white/80 hover:text-white">
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                ) : null}
                            </div>
                            {isTimerActive && (<span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{getTimerStatusText()}</span>)}
                        </div>
                    </div>
                    {isEditingFocusGoal && (<div className="mt-2"><TimeEditor /></div>)}
                    {!isEditingFocusGoal && (
                        <div className="mt-2">
                            {isTimerActive ? (
                                <Button onClick={onResumeFocusClick} className="w-full flex items-center justify-center h-8 bg-white/20 hover:bg-white/30 border-none text-white font-medium"><Timer className="h-4 w-4 mr-1.5" /> Resume Timer</Button>
                            ) : (
                                <Button onClick={onStartFocusClick} className="w-full flex items-center justify-center h-8 bg-white/20 hover:bg-white/30 border-none text-white font-medium"><Play className="h-4 w-4 mr-1.5" /> Start Focus</Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-3 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>
            <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold flex items-center shrink-0"><Clock className="mr-1.5 h-4 w-4" /> Focus Time</h2>
                    {isTimerActive && (<span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium text-right ml-2 truncate">{getTimerStatusText()}</span>)}
                </div>
                <div className="flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center my-2">
                        <div className="w-20 h-20">
                            <CircularProgressbar value={getProgressPercentage()} text={`${getProgressPercentage()}%`} strokeWidth={10} styles={buildStyles({ textSize: '22px', pathColor: '#ffffff', textColor: '#ffffff', trailColor: 'rgba(255,255,255,0.2)' })} />
                        </div>
                    </div>
                    {!isEditingFocusGoal ? (
                        <div className="flex justify-center items-center text-center mb-2 text-sm">
                            <div>
                                <div className="font-medium">{actual}</div>
                                <div className="text-xs text-white/70 flex items-center justify-center">
                                    of {goal} goal
                                    <Button onClick={onEditGoal} size="sm" variant="ghost" className="h-6 w-6 p-0 ml-1 text-white/80 hover:text-white">
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="my-2"><TimeEditor /></div>
                    )}
                </div>
                {!isEditingFocusGoal && (
                    <div className="mt-auto flex gap-2">
                        {isTimerActive ? (
                            <Button onClick={onResumeFocusClick} className="w-full flex items-center justify-center h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium"><Timer className="h-4 w-4 mr-1.5" /> Resume Timer</Button>
                        ) : (
                            <Button onClick={onStartFocusClick} className="w-full flex items-center justify-center h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium"><Play className="h-4 w-4 mr-1.5" /> Start Focus</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}