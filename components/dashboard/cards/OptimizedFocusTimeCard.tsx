'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Play, Timer, Clock, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/contexts/TimerProvider';

interface OptimizedFocusTimeCardProps {
    isLoading: boolean;
    todayProgress: any;
    isTimerActive: boolean;
    getTimerStatusText: () => string;
    formatMinutesToHoursMinutes: (minutes: number) => string;
    onStartFocusClick: () => void;
    onResumeFocusClick: () => void;
    onEditGoal: () => void;
    onSaveGoal: () => void;
    isEditingFocusGoal: boolean;
    newFocusGoal: number; // Parent's view of the goal
    setNewFocusGoal: (goal: number) => void; // Update parent's goal
    isMobile?: boolean;
}

export function OptimizedFocusTimeCard({
    isLoading,
    todayProgress,
    isTimerActive,
    getTimerStatusText,
    formatMinutesToHoursMinutes,
    onStartFocusClick,
    onResumeFocusClick,
    onEditGoal,
    onSaveGoal,
    isEditingFocusGoal,
    newFocusGoal,
    setNewFocusGoal,
    isMobile = false
}: OptimizedFocusTimeCardProps) {
    const { timeRemaining, timeElapsed, flowMode } = useTimer();
    const prevIsEditingFocusGoal = useRef(isEditingFocusGoal);

    // Internal state for the editor
    const [selectedHour, setSelectedHour] = useState(0);
    const [selectedMinute, setSelectedMinute] = useState(0);

    const getProgressPercentage = () => {
        if (!todayProgress) return 0;
        const { focusActualMinutes, focusGoalMinutes } = todayProgress;
        if (focusGoalMinutes <= 0) return 0;
        return Math.min(100, Math.round((focusActualMinutes / focusGoalMinutes) * 100));
    };

    const getFocusTimeDisplay = () => {
        if (!todayProgress) return { actual: '0m', goal: '2h' }; // Default goal display if no progress yet
        const { focusActualMinutes, focusGoalMinutes } = todayProgress;
        return {
            actual: formatMinutesToHoursMinutes(focusActualMinutes || 0),
            goal: formatMinutesToHoursMinutes(focusGoalMinutes || 120)
        };
    };

    // Effect 1: Initialize/Reset editor state ONLY when editing starts
    useEffect(() => {
        // Check if we just entered editing mode
        if (isEditingFocusGoal && !prevIsEditingFocusGoal.current) {
            // Set internal state based on the parent's current goal value (newFocusGoal)
            const initialHours = Math.min(8, Math.floor(newFocusGoal / 60));
            const initialMinutes = newFocusGoal % 60;
            setSelectedHour(initialHours);
            setSelectedMinute(initialHours === 8 ? 0 : initialMinutes);
        }
        // Update the ref for the next render check
        prevIsEditingFocusGoal.current = isEditingFocusGoal;
        // This effect should run when editing starts or if the initial goal changes *before* editing starts.
    }, [isEditingFocusGoal, newFocusGoal]);

    // Effect 2: Update parent's temporary goal state when internal editor state changes *during* editing
    useEffect(() => {
        // Only run this effect if we are currently in editing mode
        if (isEditingFocusGoal) {
            const totalMinutes = (selectedHour * 60) + selectedMinute;
            const currentEditorGoal = Math.max(1, totalMinutes); // Ensure minimum 1 minute

            // Call the parent update function.
            // We removed the check `currentEditorGoal !== newFocusGoal` here.
            // The dependency array change prevents the loop.
            setNewFocusGoal(currentEditorGoal);
        }
        // This effect should ONLY depend on the internal state that the user changes
        // (selectedHour, selectedMinute), the editing flag, and the stable setter function.
        // It should NOT depend on newFocusGoal itself to avoid the loop.
    }, [selectedHour, selectedMinute, isEditingFocusGoal, setNewFocusGoal]);

    // --- Increment/Decrement Functions (Updated for +/- 5 minutes) ---
    const incrementHour = () => {
        setSelectedHour(prev => {
            const nextHour = Math.min(8, prev + 1);
            if (nextHour === 8) setSelectedMinute(0); // Reset minutes if max hour reached
            return nextHour;
        });
    };

    const decrementHour = () => {
        setSelectedHour(prev => Math.max(0, prev - 1));
    };

    const incrementMinute = () => {
        if (selectedHour >= 8) return; // Cannot increment if already at 8h 0m

        const currentTotalMinutes = (selectedHour * 60) + selectedMinute;
        let nextTotalMinutes = currentTotalMinutes + 5;

        // Cap at 8 hours (480 minutes)
        if (nextTotalMinutes > 480) {
            nextTotalMinutes = 480;
        }

        const nextHour = Math.floor(nextTotalMinutes / 60);
        const nextMinute = nextTotalMinutes % 60;

        setSelectedHour(nextHour);
        setSelectedMinute(nextMinute);
    };

    const decrementMinute = () => {
        const currentTotalMinutes = (selectedHour * 60) + selectedMinute;
        let nextTotalMinutes = currentTotalMinutes - 5;

        // Ensure minimum is 0 minutes
        if (nextTotalMinutes < 0) {
            nextTotalMinutes = 0;
        }

        const nextHour = Math.floor(nextTotalMinutes / 60);
        const nextMinute = nextTotalMinutes % 60;

        // Prevent going below 0h 0m implicitly (though nextTotalMinutes check handles it)
        if (selectedHour > 0 || selectedMinute > 0) {
            setSelectedHour(nextHour);
            setSelectedMinute(nextMinute);
        }
    };
    // --- End Increment/Decrement ---

    const { actual, goal } = getFocusTimeDisplay();

    // Time Editor Component - Adjusted Styling
    const TimeEditor = () => (
        // Use a slightly darker overlay for the editor background
        <div className="flex flex-col items-center bg-black/30 dark:bg-black/40 rounded-lg p-3 shadow-md backdrop-blur-sm">
            {/* Hour/Minute Selectors */}
            <div className="flex items-center justify-center space-x-1 mb-3 w-full">
                {/* Hour Control */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={incrementHour}
                        // Use lighter text color for better contrast
                        className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50"
                        disabled={selectedHour >= 8}
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                        {/* Use white text color */}
                        <span className="font-bold text-lg text-white">
                            {selectedHour}
                        </span>
                    </div>
                    <button
                        onClick={decrementHour}
                        // Use lighter text color
                        className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50"
                        disabled={selectedHour <= 0}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>

                {/* Use white text color */}
                <div className="text-sm font-medium mx-1 text-white">h</div>

                {/* Minutes Control */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={incrementMinute}
                        // Use lighter text color
                        className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50"
                        disabled={selectedHour >= 8} // Disable minute changes if at 8 hours
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                        {/* Use white text color */}
                        <span className="font-bold text-lg text-white">
                            {selectedMinute.toString().padStart(2, '0')}
                        </span>
                    </div>
                    <button
                        onClick={decrementMinute}
                        // Use lighter text color
                        className="text-white/70 hover:text-white p-1 focus:outline-none disabled:opacity-50"
                        disabled={selectedHour <= 0 && selectedMinute <= 0}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>

                {/* Use white text color */}
                <div className="text-sm font-medium mx-1 text-white">m</div>
            </div>

            {/* Save Button - Adjusted Styling */}
            <Button
                onClick={onSaveGoal}
                size="sm"
                // Match style of other action buttons
                className="w-full bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                disabled={(selectedHour * 60) + selectedMinute === 0}
            >
                Save Goal
            </Button>
        </div>
    );

    // --- Mobile Layout (Uses TimeEditor) ---
    if (isMobile) {
        return (
            // Adjusted shadow and added decorative elements
            <div className="rounded-xl p-4 bg-gradient-to-r from-blue-400 to-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] text-white relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 z-0 opacity-50"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0 opacity-50"></div>
                <div className="absolute inset-0 bg-black/20 z-0"></div>

                <div className="relative z-10">
                    <div className="flex items-center">
                        {/* Progress Circle */}
                        <div className="mr-3 flex-shrink-0">
                            <div className="w-16 h-16">
                                <CircularProgressbar
                                    value={getProgressPercentage()}
                                    text={`${getProgressPercentage()}%`}
                                    strokeWidth={10}
                                    styles={buildStyles({
                                        textSize: '22px',
                                        pathColor: '#ffffff', // White path
                                        textColor: '#ffffff', // White text
                                        trailColor: 'rgba(255,255,255,0.2)', // Light trail
                                    })}
                                />
                            </div>
                        </div>
                        {/* Info Area */}
                        <div className="flex-grow">
                            <h2 className="font-bold flex items-center text-sm">
                                <Clock className="mr-1.5 h-3.5 w-3.5" /> Focus Time
                            </h2>
                            <div className="flex items-baseline mt-1 mb-1">
                                <span className="text-xl font-bold">{actual}</span>
                                <span className="ml-1 text-xs opacity-80">of {goal} goal</span>
                                {/* Edit Button (only shown when not editing) - Adjusted style */}
                                {!isEditingFocusGoal ? (
                                    <Button onClick={onEditGoal} size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0 text-white/80 hover:text-white">
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                ) : null}
                            </div>
                            {/* Timer Status */}
                            {isTimerActive && (
                                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                                    {getTimerStatusText()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Time Editor (only shown when editing) */}
                    {isEditingFocusGoal && (
                        <div className="mt-3 mb-3">
                            <TimeEditor />
                        </div>
                    )}

                    {/* Action Button (Start/Resume - only shown when not editing) - Style already matches */}
                    {!isEditingFocusGoal && (
                        <div className="mt-3">
                            {isTimerActive ? (
                                <Button onClick={onResumeFocusClick} className="w-full flex items-center justify-center py-1 h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium">
                                    <Timer className="h-4 w-4 mr-1.5" /> Resume Timer
                                </Button>
                            ) : (
                                <Button onClick={onStartFocusClick} className="w-full flex items-center justify-center py-1 h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium">
                                    <Play className="h-4 w-4 mr-1.5" /> Start Focus
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Desktop Layout (Uses TimeEditor) ---
    return (
        // Gradient, shadow, decorative elements already match
        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] text-white relative overflow-hidden h-full">
            {/* Decorative background elements */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold flex items-center">
                        <Clock className="mr-1.5 h-4 w-4" /> Focus Time
                    </h2>
                    {isTimerActive && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                            {getTimerStatusText()}
                        </span>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col justify-center">
                    {/* Progress Circle - Style already matches */}
                    <div className="flex items-center justify-center mb-3">
                        <div className="w-24 h-24">
                            <CircularProgressbar
                                value={getProgressPercentage()}
                                text={`${getProgressPercentage()}%`}
                                strokeWidth={10}
                                styles={buildStyles({
                                    textSize: '22px',
                                    pathColor: '#ffffff',
                                    textColor: '#ffffff',
                                    trailColor: 'rgba(255,255,255,0.2)',
                                })}
                            />
                        </div>
                    </div>

                    {/* Goal Display or Editor */}
                    {!isEditingFocusGoal ? (
                        <div className="flex justify-center items-center text-center mb-2 text-sm">
                            <div>
                                <div className="font-medium">{actual}</div>
                                <div className="text-xs text-white/70 flex items-center justify-center"> {/* Added flex for alignment */}
                                    of {goal} goal
                                    {/* Edit Button - Adjusted style */}
                                    <Button onClick={onEditGoal} size="sm" variant="ghost" className="h-6 w-6 p-0 ml-1 text-white/80 hover:text-white">
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-3">
                            <TimeEditor />
                        </div>
                    )}
                </div>

                {/* Action Buttons (Start/Resume - only shown when not editing) - Style already matches */}
                {!isEditingFocusGoal && (
                    <div className="mt-auto flex gap-2">
                        {isTimerActive ? (
                            <Button onClick={onResumeFocusClick} className="w-full flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium">
                                <Timer className="h-4 w-4 mr-1.5" /> Resume Timer
                            </Button>
                        ) : (
                            <Button onClick={onStartFocusClick} className="w-full flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium">
                                <Play className="h-4 w-4 mr-1.5" /> Start Focus
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}