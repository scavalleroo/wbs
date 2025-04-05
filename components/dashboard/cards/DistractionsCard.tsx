'use client';

import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { ShieldBan, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    format, isSameDay, addDays, eachDayOfInterval
} from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBlockedSite } from '@/hooks/use-blocked-site';

interface DistractionsCardProps {
    isLoading: boolean;
    todayProgress: any;
    blockedSitesCount: number;
    blockedSitesWithTime: any[];
    onManageDistractionsClick: () => void;
    formatMinutesToHoursMinutes: (minutes: number) => string;
    className?: string;
    user: any;
}

type DistractionDay = {
    date: Date;
    minutes: number;
    attemptCount: number;
    bypassCount: number;
    limitMinutes: number | null;
    limitRespected: boolean;
}

export function DistractionsCard({
    todayProgress,
    blockedSitesCount,
    onManageDistractionsClick,
    formatMinutesToHoursMinutes,
    className,
    user
}: DistractionsCardProps) {
    const [calendarData, setCalendarData] = useState<Map<string, DistractionDay>>(new Map());
    const [calendarLoading, setCalendarLoading] = useState(true);
    const { getDistractionCalendarData } = useBlockedSite({ user });

    // Calculate remaining minutes (like a fuel gauge)
    const getRemainingMinutes = () => {
        if (!todayProgress) return 0;
        const total = todayProgress.distractionGoalMinutes;
        const used = todayProgress.distractionActualMinutes;
        return Math.max(0, total - used);
    };

    // Calculate percentage of fuel left
    const getFuelPercentage = () => {
        if (!todayProgress || todayProgress.distractionGoalMinutes === 0) return 0;
        return Math.max(0, Math.min(100, (getRemainingMinutes() / todayProgress.distractionGoalMinutes) * 100));
    };

    // Fetch calendar data using the hook
    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!user) return;

            try {
                setCalendarLoading(true);
                console.log("Fetching distraction calendar data...");
                const data = await getDistractionCalendarData();
                console.log("Calendar data fetched:", data.size, "days");
                setCalendarData(data);
            } catch (err) {
                console.error('Error fetching distraction calendar data:', err);
            } finally {
                setCalendarLoading(false);
            }
        };

        fetchCalendarData();
    }, [user, getDistractionCalendarData]);

    // Generate color based on distractions and limit
    const getDistractionColorClass = (day: DistractionDay | undefined) => {
        if (!day || !day.attemptCount) return 'bg-gray-200 dark:bg-gray-700';
        if (day.limitRespected) return 'bg-green-500';
        return 'bg-red-500';
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
            return `${format(dayInfo.date, 'MMM d')}: No data recorded`;
        }

        const { minutes, attemptCount, bypassCount, limitMinutes, limitRespected } = dayInfo.dayData;

        let content = `${format(dayInfo.date, 'MMM d')}:`;

        if (attemptCount === 0) {
            content += " No distractions detected";
            return content;
        }

        content += ` ${formatMinutesToHoursMinutes(minutes)} of distractions`;
        content += `\nAttempts: ${attemptCount} (${bypassCount} bypassed)`;

        if (limitMinutes) {
            content += `\nLimit: ${formatMinutesToHoursMinutes(limitMinutes)}`;
            content += limitRespected ? ` (✓ Under limit)` : ` (✗ Over limit)`;
        }

        return content;
    };

    // Create an empty calendar with default values for when there's no data
    const createEmptyCalendar = () => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 28);

        const dayRange = eachDayOfInterval({
            start: startDate,
            end: today
        });

        const emptyMap = new Map();

        dayRange.forEach(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            // Create an empty entry with today's date
            emptyMap.set(dateStr, {
                date,
                minutes: 0,
                attemptCount: 0,
                bypassCount: 0,
                limitMinutes: 30, // default 30 minutes
                limitRespected: true
            });
        });

        return emptyMap;
    };

    // If calendar is empty after loading, use empty calendar
    useEffect(() => {
        if (!calendarLoading && calendarData.size === 0) {
            console.log("Setting empty calendar data");
            setCalendarData(createEmptyCalendar());
        }
    }, [calendarLoading, calendarData]);

    return (
        <div className={cn(
            "relative w-full rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]",
            className
        )}>
            {/* Decorative circles */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 rounded-full bg-white/10 -mr-48 z-0"></div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-72 h-72 rounded-full bg-white/10 -mr-36 z-0"></div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-48 rounded-full bg-white/10 -mr-24 z-0"></div>

            {/* Semi-transparent dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center text-white">
                        <ShieldBan className="mr-2 h-5 w-5 text-white/90" />
                        Distractions Limit
                    </h2>
                </div>

                <div className="flex flex-col-reverse md:flex-row gap-4 mb-4">
                    {/* Left Column (Calendar on desktop) */}
                    <div className="md:w-1/2 bg-white/10 rounded-lg p-3 min-h-[220px] flex flex-col order-2 md:order-1">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm text-white font-medium flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Last 28 Days Activity
                            </h3>
                        </div>

                        {calendarLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-white/70 text-xs">Loading calendar...</div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-between">
                                {/* Weekday headers with 3-letter format */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                        <div key={i} className="text-center text-[13px] text-white font-medium">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid - 7 cols × 4 rows with squares and tooltips */}
                                <TooltipProvider delayDuration={0}>
                                    <div className="grid grid-cols-7 grid-rows-4 gap-1 mb-2">
                                        {generateCalendarDays().map((dayInfo, i) => (
                                            <Tooltip key={i}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-center">
                                                        <div
                                                            className={cn(
                                                                "w-7 h-7",
                                                                getDistractionColorClass(dayInfo.dayData)
                                                            )}
                                                            style={{
                                                                opacity: dayInfo.dayData?.attemptCount || isSameDay(dayInfo.date, new Date()) ? 1 : 0.2,
                                                                borderRadius: '3px',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {isSameDay(dayInfo.date, new Date()) && (
                                                                <div className="absolute inset-0 border border-white rounded-sm"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-black/80 text-white text-xs p-2 max-w-xs whitespace-pre-line">
                                                    {formatTooltipContent(dayInfo)}
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </TooltipProvider>

                                <div className="mt-auto">
                                    {/* Update day labels to show first Monday and last Sunday */}
                                    <div className="flex justify-between items-center text-[13px] text-white mb-1">
                                        <div>{format(generateCalendarDays()[0].date, 'MMM d')}</div>
                                        <div>{format(generateCalendarDays()[27].date, 'MMM d')}</div>
                                    </div>

                                    {/* Legend with colors explanation */}
                                    <div className="flex justify-between text-[13px] text-white">
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                                            <span>No data</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                                            <span>Under limit</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                                            <span>Over limit</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Progress on desktop) */}
                    <div className="md:w-1/2 flex flex-col order-1 md:order-2">
                        {todayProgress && (
                            <div className="flex flex-col items-center justify-center space-y-5">
                                <div className="w-48 h-48 relative">
                                    {/* Clickable Progress Circle */}
                                    <button
                                        onClick={onManageDistractionsClick}
                                        className="w-full h-full rounded-full focus:outline-none group relative"
                                    >
                                        {/* Animated background gradient for warning when over 75% used */}
                                        {todayProgress.distractionActualMinutes > todayProgress.distractionGoalMinutes * 0.75 && (
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 opacity-40 animate-gradient-x"></div>
                                        )}

                                        {/* Progress Circle */}
                                        <div className="absolute inset-0 transition-transform group-hover:scale-[1.02] duration-200">
                                            <CircularProgressbar
                                                value={getFuelPercentage()}
                                                strokeWidth={8}
                                                text=""
                                                styles={buildStyles({
                                                    strokeLinecap: 'round',
                                                    // Color changes as fuel depletes
                                                    pathColor: getFuelPercentage() > 75 ? '#10B981' :
                                                        getFuelPercentage() > 40 ? '#FBBF24' :
                                                            '#EF4444',
                                                    trailColor: 'rgba(255, 255, 255, 0.2)',
                                                    textColor: '#ffffff'
                                                })}
                                            />
                                        </div>

                                        {/* Center button text */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-white font-medium text-xl opacity-90 group-hover:opacity-100 transition-opacity">
                                                {formatMinutesToHoursMinutes(getRemainingMinutes())}
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex items-center">
                                    <div className="text-sm text-white inline-flex items-center">
                                        <span className="font-semibold">
                                            {formatMinutesToHoursMinutes(todayProgress.distractionActualMinutes)}
                                            <span className="text-white/70 font-normal ml-1 mr-1">/</span>
                                            {formatMinutesToHoursMinutes(todayProgress.distractionGoalMinutes)}
                                        </span>
                                        <Button
                                            onClick={onManageDistractionsClick}
                                            variant="ghost"
                                            className="text-white hover:bg-white/10 h-6 px-1 ml-1"
                                            size="sm"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    onClick={onManageDistractionsClick}
                                    variant="outline"
                                    size="default"
                                    className="h-9 px-5 bg-white/10 hover:bg-white/20 text-white border-white/30 hover:text-white hover:border-white/50 font-medium transition-all"
                                >
                                    {blockedSitesCount > 0 ? 'Manage Blocked Sites' : 'Block Distractions'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DistractionsCard;