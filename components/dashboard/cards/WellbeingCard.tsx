'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { format, isSameDay, addDays, eachDayOfInterval } from 'date-fns';
import { Tooltip as Tooltip2, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useMood from '@/hooks/use-mood';
import { CartesianGrid, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line } from 'recharts';

interface WellbeingCardProps {
    isLoading: boolean;
    wellnessScore: number | null;
    hasRecentMoodData: boolean;
    getWellnessEmoji: (score: number | null) => string;
    onTrackMoodClick: () => void;
    className?: string;
    user?: any;
}

export function WellbeingCard({
    isLoading,
    wellnessScore,
    hasRecentMoodData,
    getWellnessEmoji,
    onTrackMoodClick,
    className,
    user
}: WellbeingCardProps) {
    const [calendarData, setCalendarData] = useState<Map<string, any>>(new Map());
    const [calendarLoading, setCalendarLoading] = useState(true);
    const { getMoodCalendarData } = useMood({ user });

    // Fetch calendar data
    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!user) return;

            try {
                setCalendarLoading(true);
                const data = await getMoodCalendarData();
                setCalendarData(data);
            } catch (err) {
                console.error('Error fetching mood calendar data:', err);
            } finally {
                setCalendarLoading(false);
            }
        };

        fetchCalendarData();
    }, [user, getMoodCalendarData]);

    // Create empty calendar if no data
    useEffect(() => {
        if (!calendarLoading && (!calendarData || calendarData.size === 0)) {
            setCalendarData(createEmptyCalendar());
        }
    }, [calendarLoading, calendarData]);

    // Create an empty calendar with default values
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
            emptyMap.set(dateStr, {
                date,
                mood_rating: null,
                sleep_rating: null,
                nutrition_rating: null,
                exercise_rating: null,
                social_rating: null,
                description: null
            });
        });

        return emptyMap;
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const mondayBasedDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
        const daysToGoBack = 21 + mondayBasedDay;
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

    // Get wellbeing color based on overall score
    const getWellbeingColorClass = (dayData: any) => {
        if (!dayData) return 'bg-gray-200 dark:bg-gray-700';

        // Calculate average score from available ratings
        const ratings = [
            dayData.mood_rating,
            dayData.sleep_rating,
            dayData.nutrition_rating,
            dayData.exercise_rating,
            dayData.social_rating
        ].filter(r => r !== null);

        if (ratings.length === 0) return 'bg-gray-200 dark:bg-gray-700';

        const avgScore = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;

        if (avgScore >= 4.5) return 'bg-blue-500'; // Superior
        if (avgScore >= 4) return 'bg-emerald-600'; // Excellent
        if (avgScore >= 3) return 'bg-green-500'; // Good
        if (avgScore >= 2) return 'bg-yellow-500'; // Fair
        if (avgScore >= 1) return 'bg-orange-500'; // Poor
        return 'bg-red-500'; // Very poor
    };

    // Format tooltip content for calendar days
    const formatTooltipContent = (dayInfo: any) => {
        if (!dayInfo.dayData || !Object.values(dayInfo.dayData).some(v => v !== null && v !== dayInfo.dayData.date)) {
            return (
                <div>
                    <div className="font-medium mb-1">{format(dayInfo.date, 'MMM d')}:</div>
                    <div>No data recorded</div>
                </div>
            );
        }

        const {
            mood_rating,
            sleep_rating,
            nutrition_rating,
            exercise_rating,
            social_rating,
            description
        } = dayInfo.dayData;

        // Helper function to render progress bar for each metric
        const renderMetricBar = (label: string, value: number | null) => {
            if (value === null) return null;

            const percentage = (value / 5) * 100;

            // Get color based on value - same color scale as used elsewhere
            const getColorForValue = (val: number) => {
                if (val >= 4.5) return 'bg-blue-500'; // Superior
                if (val >= 4) return 'bg-emerald-600'; // Excellent
                if (val >= 3) return 'bg-green-500'; // Good
                if (val >= 2) return 'bg-yellow-500'; // Fair
                if (val >= 1) return 'bg-orange-500'; // Poor
                return 'bg-red-500'; // Very poor
            };

            return (
                <div className="mb-2">
                    <div className="flex justify-between mb-1 text-xs">
                        <span>{label}</span>
                        <span>{value}/5</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full relative ${getColorForValue(value)}`}
                            style={{ width: `${percentage}%` }}
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
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="min-w-[200px]">
                <div className="font-medium mb-2">{format(dayInfo.date, 'MMMM d')}</div>

                {description && (
                    <div className="mb-3 pb-2 border-b border-gray-600 text-sm italic">
                        "{description}"
                    </div>
                )}

                {renderMetricBar('Mood', mood_rating)}
                {renderMetricBar('Sleep', sleep_rating)}
                {renderMetricBar('Nutrition', nutrition_rating)}
                {renderMetricBar('Exercise', exercise_rating)}
                {renderMetricBar('Social', social_rating)}
            </div>
        );
    };

    // Get the wellbeing metrics to display
    const getWellbeingMetrics = () => {
        if (!hasRecentMoodData || !calendarData) return [];

        // Get today's data
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = calendarData.get(today);

        if (!todayData) return [];

        const metrics = [
            { name: 'Mood', value: todayData.mood_rating },
            { name: 'Sleep', value: todayData.sleep_rating },
            { name: 'Nutrition', value: todayData.nutrition_rating },
            { name: 'Exercise', value: todayData.exercise_rating },
            { name: 'Social', value: todayData.social_rating }
        ].filter(m => m.value !== null);

        return metrics;
    };

    // Add this function before the return statement

    // Calculate daily wellbeing score from ratings
    const calculateWellbeingScore = (dayData: any): number | null => {
        if (!dayData) return null;

        const ratings = [
            dayData.mood_rating,
            dayData.sleep_rating,
            dayData.nutrition_rating,
            dayData.exercise_rating,
            dayData.social_rating
        ].filter(r => r !== null);

        if (ratings.length === 0) return null;

        // Use a weighted calculation similar to overall wellness score
        // (but simplified for illustration)
        const avgRating = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;

        // Convert 0-5 scale to 0-100 scale
        return Math.round(avgRating * 20);
    };

    const renderSevenDayTrend = () => {
        // Get last 7 days of data
        const today = new Date();
        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = calendarData.get(dateStr);

            last7Days.push({
                date,
                dateFormatted: format(date, 'MM/dd'),
                score: calculateWellbeingScore(dayData)
            });
        }

        // Filter out days with no data
        const daysWithData = last7Days.filter(day => day.score !== null);

        if (daysWithData.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-white/70 text-xs">
                    No wellbeing data available for the last 7 days
                </div>
            );
        }

        // Format data for recharts
        const chartData = daysWithData.map(day => ({
            date: day.dateFormatted,
            score: day.score,
            color: getPointColor(day.score as number),
            fullDate: format(day.date, 'MMMM d')
        }));

        // Get color based on score
        function getPointColor(score: number) {
            if (score > 80) return '#3b82f6'; // Blue
            if (score > 70) return '#059669'; // Emerald
            if (score > 50) return '#10b981'; // Green
            if (score > 40) return '#f59e0b'; // Yellow
            if (score > 30) return '#f97316'; // Orange
            return '#ef4444'; // Red
        }

        // Custom dot renderer for the line chart
        const CustomDot = (props: any) => {
            const { cx, cy, payload } = props;

            return (
                <g>
                    <circle
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill={payload.color}
                    />
                    <text
                        x={cx}
                        y={cy - 20}
                        textAnchor="middle"
                        fill="white"
                        fontSize="13"
                        fontWeight="bold"
                    >
                        {payload.score}
                    </text>
                </g>
            );
        };

        // Custom tooltip for the line chart that matches our calendar tooltip style
        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length > 0) {
                const data = payload[0].payload;
                const dateStr = format(new Date(data.fullDate), 'yyyy-MM-dd');
                const dayData = calendarData.get(dateStr);

                if (!dayData) {
                    // If we can't find the day data, show at least the score
                    return (
                        <div className="bg-black/80 text-white text-xs p-3 rounded-md shadow-md min-w-[200px]">
                            <div className="font-medium mb-2">{data.fullDate}</div>
                            <div className="mb-2">
                                <div className="flex justify-between mb-1">
                                    <span>Wellbeing Score</span>
                                    <span>{data.score}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full relative"
                                        style={{
                                            width: `${data.score}%`,
                                            backgroundColor: data.color
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                const {
                    mood_rating,
                    sleep_rating,
                    nutrition_rating,
                    exercise_rating,
                    social_rating,
                    description
                } = dayData;

                // Helper function to render progress bar for each metric
                const renderMetricBar = (label: string, value: number | null) => {
                    if (value === null) return null;

                    const percentage = (value / 5) * 100;

                    // Get color based on value - same color scale as used elsewhere
                    const getColorForValue = (val: number) => {
                        if (val >= 4.5) return 'bg-blue-500'; // Superior
                        if (val >= 4) return 'bg-emerald-600'; // Excellent
                        if (val >= 3) return 'bg-green-500'; // Good
                        if (val >= 2) return 'bg-yellow-500'; // Fair
                        if (val >= 1) return 'bg-orange-500'; // Poor
                        return 'bg-red-500'; // Very poor
                    };

                    return (
                        <div className="mb-2">
                            <div className="flex justify-between mb-1 text-xs">
                                <span>{label}</span>
                                <span>{value}/5</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full relative ${getColorForValue(value)}`}
                                    style={{ width: `${percentage}%` }}
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
                                </div>
                            </div>
                        </div>
                    );
                };

                return (
                    <div className="bg-black/80 text-white text-xs p-3 rounded-md shadow-md min-w-[200px]">
                        <div className="font-medium mb-2">{data.fullDate}</div>

                        {description && (
                            <div className="mb-3 pb-2 border-b border-gray-600 text-sm italic">
                                "{description}"
                            </div>
                        )}

                        <div className="mb-2">
                            <div className="flex justify-between mb-1">
                                <span>Wellbeing Score</span>
                                <span>{data.score}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full relative"
                                    style={{
                                        width: `${data.score}%`,
                                        backgroundColor: data.color
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
                                </div>
                            </div>
                        </div>

                        {renderMetricBar('Mood', mood_rating)}
                        {renderMetricBar('Sleep', sleep_rating)}
                        {renderMetricBar('Nutrition', nutrition_rating)}
                        {renderMetricBar('Exercise', exercise_rating)}
                        {renderMetricBar('Social', social_rating)}
                    </div>
                );
            }

            return null;
        };

        return (
            <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 30, right: 15, left: 15, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                            tickLine={false}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                            hide
                            domain={[(dataMin: number) => Math.max(0, dataMin - 10), (dataMax: number) => Math.min(100, dataMax + 10)]}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="white"
                            strokeWidth={2}
                            dot={<CustomDot />}
                            activeDot={{ r: 8, fill: 'white', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={1000}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className={cn(
            "relative w-full rounded-2xl p-6 sm:p-6 p-4 overflow-hidden bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600 shadow-[0_0_15px_rgba(192,38,211,0.4)]",
            className
        )}>
            {/* Decorative circles */}
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 -mb-48 -mr-24 z-0"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-white/10 -mb-36 -mr-12 z-0"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/10 -mb-24 -mr-6 z-0"></div>

            {/* Semi-transparent dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-4 h-full">
                    {/* Left side: Wellness Score & Metrics */}
                    <div className="md:w-1/2 flex flex-col h-full">
                        <div className="mb-3 sm:mb-5">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center text-white">
                                <Heart className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-white/90" />
                                Wellbeing
                            </h2>
                        </div>

                        <div className="flex-grow flex flex-col">
                            <div className="flex items-center justify-center mb-4 sm:mb-6">
                                {hasRecentMoodData && wellnessScore !== null ? (
                                    <div className="w-36 h-36 sm:w-48 sm:h-48 relative">
                                        <CircularProgressbar
                                            value={wellnessScore}
                                            maxValue={100}
                                            strokeWidth={8}
                                            text=""
                                            styles={buildStyles({
                                                strokeLinecap: 'round',
                                                pathColor: wellnessScore > 80 ? '#3b82f6' :
                                                    wellnessScore > 70 ? '#059669' :
                                                        wellnessScore > 50 ? '#10b981' :
                                                            wellnessScore > 40 ? '#f59e0b' :
                                                                wellnessScore > 30 ? '#f97316' :
                                                                    '#ef4444',
                                                trailColor: 'rgba(255, 255, 255, 0.2)',
                                            })}
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="text-3xl sm:text-4xl mb-1">{getWellnessEmoji(wellnessScore)}</div>
                                            <div className="text-lg sm:text-xl text-white font-bold">{wellnessScore}/100</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
                                        <div className="text-3xl sm:text-4xl">{getWellnessEmoji(null)}</div>
                                    </div>
                                )}
                            </div>

                            {hasRecentMoodData && (
                                <div className="flex mb-3 sm:mb-4 justify-center overflow-x-auto pb-1 sm:pb-2 -mx-2 px-2">
                                    <div className="flex flex-nowrap gap-0.5 sm:gap-2 min-w-min w-full">
                                        {getWellbeingMetrics().map((metric, index) => (
                                            <div
                                                key={index}
                                                className="bg-white/10 rounded-lg p-1 sm:p-2 flex-1 min-w-[58px] sm:w-[62px] flex flex-col items-center text-center"
                                            >
                                                <span className="text-white/80 text-[10px] sm:text-xs whitespace-nowrap">{metric.name}</span>
                                                <span className="text-white font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
                                                    {metric.value}
                                                    <span className="text-[9px] sm:text-xs text-white/70">/5</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex-grow"></div>

                            <Button
                                onClick={onTrackMoodClick}
                                className="w-full py-4 sm:py-6 text-base sm:text-lg bg-white hover:bg-white/90 text-purple-600 flex items-center justify-center gap-2 shadow-lg font-medium mt-3 sm:mt-4"
                            >
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                                {hasRecentMoodData ? 'Update' : 'Check In'}
                            </Button>
                        </div>
                    </div>

                    {/* Right side: Calendar */}
                    <div className="md:w-1/2 bg-white/10 rounded-lg p-2 sm:p-3 flex flex-col mt-3 sm:mt-4 md:mt-0">
                        {/* 7-day trend chart */}
                        <h3 className="text-xs sm:text-sm text-white font-medium mb-1 sm:mb-2 flex items-center px-1">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 7L13 15L9 11L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 13V7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            7-Day Wellbeing Trend
                        </h3>
                        <div className="w-full relative p-1 sm:p-2 h-[140px] sm:h-[160px]">
                            {renderSevenDayTrend()}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/20 mb-2 sm:mb-4"></div>

                        <div className="flex justify-between items-center mb-1 sm:mb-2 px-1">
                            <h3 className="text-xs sm:text-sm text-white font-medium flex items-center">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Last 28 Days
                            </h3>
                        </div>

                        {/* Calendar display */}
                        {calendarLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-white/70 text-xs">Loading calendar...</div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-between">
                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 gap-[2px] sm:gap-1 mb-[2px] sm:mb-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                        <div key={i} className="text-center text-[11px] sm:text-[13px] text-white font-medium">
                                            <span className="hidden sm:inline">{day}</span>
                                            <span className="sm:hidden">{day.charAt(0)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <TooltipProvider delayDuration={0}>
                                    <div className="grid grid-cols-7 grid-rows-4 gap-[2px] sm:gap-1 mb-2 sm:mb-4">
                                        {generateCalendarDays().map((dayInfo, i) => (
                                            <Tooltip2 key={i}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center justify-center">
                                                        <div
                                                            className={cn(
                                                                "w-6 h-6 sm:w-7 sm:h-7",
                                                                getWellbeingColorClass(dayInfo.dayData)
                                                            )}
                                                            style={{
                                                                opacity: dayInfo.dayData?.mood_rating !== null || isSameDay(dayInfo.date, new Date()) ? 1 : 0.2,
                                                                borderRadius: '3px',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {/* Note indicator dot */}
                                                            {dayInfo.dayData?.description && (
                                                                <div className="absolute top-0.5 right-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                                                            )}

                                                            {/* Today indicator */}
                                                            {isSameDay(dayInfo.date, new Date()) && (
                                                                <div className="absolute inset-0 border border-white" style={{ borderRadius: '3px', borderWidth: '2px' }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    className="bg-black/80 text-white text-xs p-2 max-w-xs"
                                                >
                                                    {formatTooltipContent(dayInfo)}
                                                </TooltipContent>
                                            </Tooltip2>
                                        ))}
                                    </div>
                                </TooltipProvider>

                                <div className="">
                                    {/* Date range labels */}
                                    <div className="flex justify-between items-center text-[10px] sm:text-[13px] text-white mb-1 px-1">
                                        <div>{format(generateCalendarDays()[0].date, 'MMM d')}</div>
                                        <div>{format(generateCalendarDays()[27].date, 'MMM d')}</div>
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

export default WellbeingCard;