'use client';

import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Clock, Timer, Play, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import {
    format, isSameDay, addDays,
} from 'date-fns';
import { User } from '@supabase/supabase-js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTimer } from '@/contexts/TimerProvider';

interface FocusTimeCardProps {
    isLoading: boolean;
    todayProgress: any;
    isTimerActive: boolean;
    isEditingFocusGoal: boolean;
    newFocusGoal: number;
    onNewFocusGoalChange: (value: number) => void;
    onEditGoalClick: () => void;
    onSaveGoalClick: () => void;
    onStartFocusClick: () => void;
    onResumeFocusClick: () => void;
    getTimerStatusText: () => string;
    formatMinutesToHoursMinutes: (minutes: number) => string;
    className?: string;
    user: User | null | undefined;
}

type FocusDay = {
    date: Date;
    minutes: number;
    goalMinutes: number | null;
    goalMet: boolean;
}

export function FocusTimeCard({
    isLoading,
    todayProgress,
    isTimerActive,
    isEditingFocusGoal,
    newFocusGoal,
    onNewFocusGoalChange,
    onEditGoalClick,
    onSaveGoalClick,
    onStartFocusClick,
    onResumeFocusClick,
    getTimerStatusText,
    formatMinutesToHoursMinutes,
    className,
    user
}: FocusTimeCardProps) {
    const [calendarData, setCalendarData] = useState<Map<string, FocusDay>>(new Map());
    const [calendarLoading, setCalendarLoading] = useState(true);
    const [hoursInput, setHoursInput] = useState('0');
    const [minutesInput, setMinutesInput] = useState('0');
    const { timeRemaining, timeElapsed, flowMode, isRunning } = useTimer();

    // Initialize hours/minutes inputs when editing
    useEffect(() => {
        if (isEditingFocusGoal && newFocusGoal) {
            const hours = Math.floor(newFocusGoal / 60);
            const minutes = newFocusGoal % 60;
            setHoursInput(hours.toString());
            setMinutesInput(minutes.toString());
        }
    }, [isEditingFocusGoal, newFocusGoal]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setHoursInput(value);
        updateGoalValue(parseInt(value) || 0, parseInt(minutesInput) || 0);
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (parseInt(value) < 60) {
            setMinutesInput(value);
            updateGoalValue(parseInt(hoursInput) || 0, parseInt(value) || 0);
        }
    };

    const updateGoalValue = (hours: number, minutes: number) => {
        const totalMinutes = (hours * 60) + minutes;
        onNewFocusGoalChange(totalMinutes > 0 ? totalMinutes : 15); // Minimum 15 minutes
    };

    // Fetch calendar data (monthly focus history)
    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!user) return;

            try {
                setCalendarLoading(true);
                const supabase = createClient();

                // Calculate date range for last 30 days
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today

                // Format dates for DB query
                const startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
                const endDate = format(today, 'yyyy-MM-dd');

                // Get all user goals for this period
                const { data: goals } = await supabase
                    .from('user_daily_goals')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('date', startDate)
                    .lte('date', endDate);

                // Get all focus sessions for this period
                const { data: sessions } = await supabase
                    .from('focus_sessions')
                    .select('actual_duration, created_at, status')
                    .eq('user_id', user.id)
                    .eq('status', 'completed')
                    .gte('created_at', `${startDate}T00:00:00`)
                    .lte('created_at', `${endDate}T23:59:59`);

                // Create a map to store data by date string for quick lookup
                const daysMap = new Map<string, FocusDay>();

                // Process each day and store in the map
                for (let i = 0; i < 30; i++) {
                    const date = addDays(thirtyDaysAgo, i);
                    const dateStr = format(date, 'yyyy-MM-dd');

                    // Find goal for this day
                    const dayGoal = goals?.find(g => g.date === dateStr);

                    // Find sessions for this day
                    const daySessions = sessions?.filter(s => {
                        const sessionDate = new Date(s.created_at);
                        return isSameDay(sessionDate, date);
                    }) || [];

                    // Calculate total focus minutes
                    const focusSeconds = daySessions.reduce(
                        (total, session) => total + (session.actual_duration || 0), 0
                    );
                    const focusMinutes = Math.floor(focusSeconds / 60);

                    // Calculate if goal was met
                    const goalMinutes = dayGoal?.focus_time_minutes || null;
                    const goalMet = goalMinutes !== null && focusMinutes >= goalMinutes;

                    daysMap.set(dateStr, {
                        date,
                        minutes: focusMinutes,
                        goalMinutes,
                        goalMet
                    });
                }

                setCalendarData(daysMap);
            } catch (err) {
                console.error('Error fetching focus calendar data:', err);
            } finally {
                setCalendarLoading(false);
            }
        };

        fetchCalendarData();
    }, [user]);

    // Generate color based on focus time and goal
    const getFocusColorClass = (day: FocusDay | undefined) => {
        if (!day || !day.minutes) return 'bg-gray-200 dark:bg-gray-700';
        if (day.goalMet) return 'bg-green-600';
        if (day.goalMinutes && day.minutes >= day.goalMinutes * 0.6) return 'bg-green-500';
        if (day.goalMinutes && day.minutes >= day.goalMinutes * 0.3) return 'bg-green-400';
        return 'bg-green-300';
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const today = new Date();

        // Get day of week (0-6, with 0 being Sunday in JavaScript)
        const todayDayOfWeek = today.getDay();

        // Convert to Monday-first format (0-6, with 0 being Monday, 6 being Sunday)
        const mondayBasedDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

        // Calculate days to go back to reach the first Monday of our 4-week calendar
        // This is: (3 complete weeks) + (days to reach previous Monday)
        const daysToGoBack = 21 + mondayBasedDay;

        // Calculate the start date (first Monday)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToGoBack);

        const days = [];
        for (let i = 0; i < 28; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = calendarData.get(dateStr);

            days.push({
                date,
                dayData,
                dayOfWeek: format(date, 'E')[0] // First letter of day name
            });
        }

        return days;
    };


    const formatTooltipContent = (dayInfo: any) => {
        if (!dayInfo.dayData) {
            return `${format(dayInfo.date, 'MMM d')}: No activity recorded`;
        }

        const { minutes, goalMinutes, goalMet } = dayInfo.dayData;
        const formattedMinutes = formatTime(minutes);
        let content = `${format(dayInfo.date, 'MMM d')}: ${formattedMinutes}`;

        if (goalMinutes) {
            content += ` / Goal: ${formatTime(goalMinutes)}`;
        }

        if (goalMet) {
            content += ` (Goal met!)`;
        }

        return content;
    };

    // Format timer for display (same as SidebarItems)
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

    // Get the appropriate time value to display (same logic as SidebarItems)
    const displayTime = flowMode ? timeElapsed : timeRemaining;

    const CalendarTooltipContent = ({ dayInfo }: { dayInfo: any }) => {
        const { date, dayData } = dayInfo;
        const formattedDate = format(date, 'MMMM d, yyyy');

        if (!dayData || !dayData.minutes) {
            return (
                <div className="bg-black/80 text-white text-xs p-3 rounded-md shadow-md min-w-[200px]">
                    <div className="font-medium mb-2">{formattedDate}</div>
                    <div className="italic text-white/70">No focus time recorded</div>
                </div>
            );
        }

        const { minutes, goalMinutes, goalMet } = dayData;
        const formattedMinutes = formatMinutesToHoursMinutes(minutes);
        const formattedGoal = goalMinutes ? formatMinutesToHoursMinutes(goalMinutes) : null;

        // Calculate progress percentage
        const progressPercentage = goalMinutes
            ? Math.min(100, (minutes / goalMinutes) * 100)
            : 100;

        // Determine color based on progress
        const getProgressColor = () => {
            if (goalMet) return '#10B981'; // green-500
            if (goalMinutes && minutes >= goalMinutes * 0.6) return '#34D399'; // green-400
            if (goalMinutes && minutes >= goalMinutes * 0.3) return '#6EE7B7'; // green-300
            return '#A7F3D0'; // green-200
        };

        // Determine if we should show the goal marker
        const showGoalMarker = goalMinutes && minutes > goalMinutes;

        return (
            <div className="bg-black/80 text-white text-xs p-3 rounded-md shadow-md min-w-[200px]">
                <div className="font-medium mb-2">{formattedDate}</div>

                <div className="mb-2">
                    <div className="flex justify-between mb-1">
                        <span>Focus Time</span>
                        <span className="font-medium">
                            {formattedMinutes}
                            {formattedGoal && <span className="text-white/70 ml-1">/ {formattedGoal}</span>}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full relative"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: getProgressColor()
                            }}
                        >
                            {/* Circle indicator */}
                            <div
                                className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-sm border border-gray-500"
                                style={{
                                    right: '0px',
                                    top: '50%',
                                    transform: 'translate(50%, -50%)'
                                }}
                            />

                            {/* Goal marker line - only shown when goal is exceeded */}
                            {showGoalMarker && (
                                <div
                                    className="absolute h-3 w-0.5 bg-white border border-gray-500"
                                    style={{
                                        left: `${(goalMinutes / minutes) * 100}%`,
                                        top: '50%',
                                        transform: 'translateY(-50%)'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {goalMet && (
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Daily goal completed
                    </div>
                )}

                {showGoalMarker && (
                    <div className="text-xs mt-1 text-white/70">
                        You exceeded your goal by {formatMinutesToHoursMinutes(minutes - goalMinutes)}
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className={cn(
            "relative w-full rounded-2xl p-4 sm:p-5 overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]",
            className
        )}>
            {/* Decorative circles */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 rounded-full bg-white/10 -ml-48 z-0"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 rounded-full bg-white/10 -ml-36 z-0"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 rounded-full bg-white/10 -ml-24 z-0"></div>

            {/* Semi-transparent dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-2 sm:mb-4">
                    {/* Left Column: Title, Button and Progress */}
                    <div className="md:w-1/2 flex flex-col">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-bold flex items-center text-white">
                                <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white/90" />
                                Today's Focus
                            </h2>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-5">
                            {todayProgress && (
                                <div className="w-36 h-36 sm:w-48 sm:h-48 relative">
                                    {/* Clickable Progress Circle */}
                                    <button
                                        onClick={isTimerActive ? onResumeFocusClick : onStartFocusClick}
                                        className="w-full h-full rounded-full focus:outline-none group relative"
                                    >
                                        {/* Animated background gradient for active sessions */}
                                        {isTimerActive && (
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-green-400 opacity-40 animate-gradient-x"></div>
                                        )}

                                        {/* Progress Circle */}
                                        <div className="absolute inset-0 transition-transform group-hover:scale-[1.02] duration-200">
                                            <CircularProgressbar
                                                value={Math.min(100, (todayProgress.focusActualMinutes / todayProgress.focusGoalMinutes) * 100)}
                                                strokeWidth={8}
                                                text=""
                                                styles={buildStyles({
                                                    strokeLinecap: 'round',
                                                    pathColor: todayProgress.focusGoalMet ? '#10B981' : '#ffffff',
                                                    trailColor: 'rgba(255, 255, 255, 0.2)',
                                                    textColor: '#ffffff'
                                                })}
                                            />
                                        </div>

                                        {/* Center button text */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-white font-medium text-base sm:text-xl opacity-90 group-hover:opacity-100 transition-opacity">
                                                {isTimerActive
                                                    ? formatTime(displayTime)
                                                    : "Start Focus"
                                                }
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {isEditingFocusGoal ? (
                                <div className="flex flex-col items-center mt-1 sm:mt-2 gap-1 sm:gap-2 text-white">
                                    <div className="text-xs sm:text-sm text-white/90 mb-1">
                                        Today's focus time: <span className="font-medium">{formatMinutesToHoursMinutes(todayProgress?.focusActualMinutes || 0)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex items-center bg-white/10 rounded-md p-1 sm:p-2">
                                            <Input
                                                type="text"
                                                className="w-10 sm:w-12 h-7 sm:h-8 text-center bg-white/20 border-white/30 text-white text-xs"
                                                value={hoursInput}
                                                onChange={handleHoursChange}
                                            />
                                            <span className="mx-1 text-xs">h</span>
                                            <Input
                                                type="text"
                                                className="w-10 sm:w-12 h-7 sm:h-8 text-center bg-white/20 border-white/30 text-white text-xs"
                                                value={minutesInput}
                                                onChange={handleMinutesChange}
                                            />
                                            <span className="mx-1 text-xs">m</span>
                                            <Button
                                                onClick={onSaveGoalClick}
                                                variant="secondary"
                                                size="sm"
                                                className="ml-1 sm:ml-2 h-7 sm:h-8 bg-white/90 text-indigo-700 hover:bg-white border-0 text-xs font-medium"
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div className="text-xs sm:text-sm text-white mb-1 sm:mb-2 inline-flex items-center">
                                            <span className="font-semibold">
                                                {formatMinutesToHoursMinutes(todayProgress?.focusActualMinutes || 0)}
                                                <span className="text-white/70 font-normal ml-1 mr-1">/</span>
                                                {formatMinutesToHoursMinutes(todayProgress?.focusGoalMinutes || 0)}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={onEditGoalClick}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 sm:h-9 px-3 sm:px-5 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:text-white hover:border-white/50 font-medium transition-all text-xs sm:text-sm"
                                        >
                                            Set Daily Goal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Calendar */}
                    <div className="md:w-1/2 bg-white/10 rounded-lg p-2 sm:p-3 min-h-[220px] flex flex-col mt-2 sm:mt-0">
                        <div className="flex justify-between items-center mb-1 sm:mb-2">
                            <h3 className="text-xs sm:text-sm text-white font-medium flex items-center">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Last 28 Days
                            </h3>
                        </div>

                        {calendarLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-white/70 text-xs">Loading calendar...</div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-between">
                                {/* Weekday headers with 3-letter format for larger screens, 1-letter for mobile */}
                                <div className="grid grid-cols-7 gap-[2px] sm:gap-1 mb-[2px] sm:mb-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                        <div key={i} className="text-center text-[11px] sm:text-[13px] text-white font-medium">
                                            <span className="hidden sm:inline">{day}</span>
                                            <span className="sm:hidden">{day.charAt(0)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid - 7 cols × 4 rows with squares and tooltips */}
                                <TooltipProvider delayDuration={0}>
                                    <div className="grid grid-cols-7 grid-rows-4 gap-[2px] sm:gap-1 mb-1 sm:mb-2">
                                        {generateCalendarDays().map((dayInfo, i) => (
                                            <Tooltip key={i}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-center">
                                                        <div
                                                            className={cn(
                                                                "w-6 h-6 sm:w-7 sm:h-7",
                                                                getFocusColorClass(dayInfo.dayData)
                                                            )}
                                                            style={{
                                                                opacity: dayInfo.dayData?.minutes || isSameDay(dayInfo.date, new Date()) ? 1 : 0.2,
                                                                borderRadius: '3px',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {isSameDay(dayInfo.date, new Date()) && (
                                                                <div className="absolute inset-0 border border-white" style={{ borderRadius: '3px', borderWidth: '2px' }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="p-0 border-0 bg-transparent shadow-none">
                                                    <CalendarTooltipContent dayInfo={dayInfo} />
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </TooltipProvider>

                                <div className="mt-auto">
                                    {/* Update day labels to show first Monday and last Sunday */}
                                    <div className="flex justify-between items-center text-[10px] sm:text-[13px] text-white mb-1">
                                        <div>{format(generateCalendarDays()[0].date, 'MMM d')}</div>
                                        <div>{format(generateCalendarDays()[27].date, 'MMM d')}</div>
                                    </div>

                                    {/* Legend with smaller squares on mobile */}
                                    <div className="flex justify-between text-[10px] sm:text-[13px] text-white">
                                        <div>Less</div>
                                        <div className="flex items-center gap-[2px] sm:gap-1">
                                            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                                            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-green-300 rounded-sm"></div>
                                            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-green-400 rounded-sm"></div>
                                            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-green-500 rounded-sm"></div>
                                            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-green-600 rounded-sm"></div>
                                        </div>
                                        <div>More</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FocusTimeCard;
