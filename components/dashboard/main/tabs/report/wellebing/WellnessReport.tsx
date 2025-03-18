import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay, isToday, isFuture, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useMood from '@/hooks/use-mood';
import MoodTrackingModal from '@/components/dashboard/main/moodTracking/MoodTrackingModal';
import { getFormattedDateLabel } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';
import { Brain, Heart, InfoIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface WellnessReportProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'year';
    hideTitle?: boolean;
}

interface DailyScore {
    date: string;
    formattedDate: string;
    wellbeingScore: number | null;
    isComplete: boolean;
    isFutureDate: boolean;
    hasData: boolean;
    hasMoodEntry: boolean;
    missingFields: string[];
    displayScore: number | null;
    mood: number | null;
    sleep: number | null;
    nutrition: number | null;
    exercise: number | null;
    social: number | null;
    moodRaw: number | null;
    sleepRaw: number | null;
    nutritionRaw: number | null;
    exerciseRaw: number | null;
    socialRaw: number | null;
    description: string | null;
}

const WellnessReport = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
    hideTitle = false
}: WellnessReportProps) => {
    const [timeRange, setTimeRange] = useState(externalTimeRange || 'week');
    const [wellbeingData, setWellbeingData] = useState<DailyScore[]>([]);
    const [currentScore, setCurrentScore] = useState<number | null>(null);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['wellbeing']);

    const metricColors = {
        wellbeing: '#3B82F6', // Blue-500 - primary wellness color
        mood: '#F59E0B',      // Amber-500
        sleep: '#8B5CF6',     // Purple-500
        nutrition: '#10B981', // Emerald-500
        exercise: '#3B82F6',  // Blue-500
        social: '#EC4899'     // Pink-500
    };

    const metricLabels = {
        wellbeing: 'Overall Score',
        mood: 'Mood',
        sleep: 'Sleep',
        nutrition: 'Nutrition',
        exercise: 'Exercise',
        social: 'Social'
    };

    const { getMoodHistory } = useMood({ user });

    useEffect(() => {
        if (externalTimeRange) {
            setTimeRange(externalTimeRange);
        }
    }, [externalTimeRange]);

    // Function to toggle metrics
    const toggleMetric = (metric: string) => {
        setSelectedMetrics(prev => {
            // If it's already selected, remove it
            if (prev.includes(metric)) {
                return prev.filter(m => m !== metric);
            }
            // If it's not selected, add it
            return [...prev, metric];
        });
    };

    // Map 1-5 ratings to 0-100 scale for consistent display
    const normalizeRating = (rating: number | null): number | null => {
        if (rating === null) return null;
        return Math.round((rating / 5) * 100);
    };

    // Calculate overall wellbeing score (0-100) from individual metrics
    const calculateWellbeingScore = (
        mood: number | null,
        sleep: number | null,
        nutrition: number | null,
        exercise: number | null,
        social: number | null
    ): number | null => {
        // Count how many metrics have values
        const values = [mood, sleep, nutrition, exercise, social].filter(v => v !== null);

        if (values.length === 0) return null;

        // Calculate points per metric (distribute 100 points among available metrics)
        const pointsPerMetric = 100 / values.length;

        // Calculate score by scaling each available metric (1-5) to its portion of 100
        let score = 0;
        if (mood !== null) score += (mood / 5) * pointsPerMetric;
        if (sleep !== null) score += (sleep / 5) * pointsPerMetric;
        if (nutrition !== null) score += (nutrition / 5) * pointsPerMetric;
        if (exercise !== null) score += (exercise / 5) * pointsPerMetric;
        if (social !== null) score += (social / 5) * pointsPerMetric;

        return Math.round(score);
    };

    // Check which fields are missing in the data
    const getMissingFields = (
        mood: number | null,
        sleep: number | null,
        nutrition: number | null,
        exercise: number | null,
        social: number | null
    ): string[] => {
        const missing: string[] = [];
        if (mood === null) missing.push('mood');
        if (sleep === null) missing.push('sleep');
        if (nutrition === null) missing.push('nutrition');
        if (exercise === null) missing.push('exercise');
        if (social === null) missing.push('social');
        return missing;
    };

    // Fetch mood data based on time range
    useEffect(() => {
        const loadWellbeingData = async () => {
            let days;

            switch (timeRange) {
                case 'week':
                    days = 7;
                    break;
                case 'month':
                    days = 30;
                    break;
                case 'year':
                    days = 365;
                    break;
                default:
                    days = 7;
            }

            // Get date range
            const dateRange = eachDayOfInterval({
                start: subDays(new Date(), days - 1),
                end: new Date()
            });

            // Fetch mood data for date range
            const startDate = startOfDay(dateRange[0]);
            const endDate = endOfDay(dateRange[dateRange.length - 1]);

            const moodHistory = await getMoodHistory(startDate.toISOString(), endDate.toISOString());

            // Format data and calculate wellbeing score for each day
            const formattedData = dateRange.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayData = moodHistory.find(
                    item => item.tracked_date === dateStr
                );

                // Check if we have any data for this day
                const hasData = !!dayData;
                const hasMoodEntry = !!dayData;

                // Check which fields are missing
                const missingFields = dayData ? getMissingFields(
                    dayData.mood_rating,
                    dayData.sleep_rating,
                    dayData.nutrition_rating,
                    dayData.exercise_rating,
                    dayData.social_rating
                ) : ['mood', 'sleep', 'nutrition', 'exercise', 'social'];

                // Calculate wellbeing score if we have data
                const wellbeingScore = dayData ? calculateWellbeingScore(
                    dayData.mood_rating,
                    dayData.sleep_rating,
                    dayData.nutrition_rating,
                    dayData.exercise_rating,
                    dayData.social_rating
                ) : null;

                // Check if the data is complete
                const isComplete = hasData && missingFields.length === 0;

                // Check if this is a future date
                const isFutureDate = isFuture(date) || isToday(date);

                return {
                    date: dateStr,
                    formattedDate: format(date, 'MMM dd'),
                    wellbeingScore,
                    displayScore: wellbeingScore, // Keep null values instead of converting to 0
                    mood: normalizeRating(dayData?.mood_rating),
                    sleep: normalizeRating(dayData?.sleep_rating),
                    nutrition: normalizeRating(dayData?.nutrition_rating),
                    exercise: normalizeRating(dayData?.exercise_rating),
                    social: normalizeRating(dayData?.social_rating),
                    moodRaw: dayData?.mood_rating,
                    sleepRaw: dayData?.sleep_rating,
                    nutritionRaw: dayData?.nutrition_rating,
                    exerciseRaw: dayData?.exercise_rating,
                    socialRaw: dayData?.social_rating,
                    description: dayData?.description || null,
                    isComplete,
                    isFutureDate,
                    hasData,
                    hasMoodEntry,
                    missingFields
                };
            });

            setWellbeingData(formattedData);

            // Set current score (most recent complete score)
            const latestScore = formattedData
                .slice()
                .reverse()
                .find(data => data.wellbeingScore !== null && data.isComplete)?.wellbeingScore;

            setCurrentScore(latestScore || null);
        };

        loadWellbeingData();
    }, [timeRange, getMoodHistory, showMoodModal]); // Re-run when modal is closed

    // Get score color based on value
    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-neutral-400";
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-blue-500";
        if (score >= 40) return "text-amber-500";
        return "text-rose-500";
    };

    const handleDataPointClick = (data: any) => {
        // Allow clicking on any past date (whether it has data or not)
        if (data && !data.isFutureDate) {
            setSelectedDate(data.date);
            setShowMoodModal(true);
        }
    };

    // Update the renderDot function to properly position missing data dots at the bottom
    const renderDot = (props: any) => {
        const { cx, cy, payload, index, yAxis, height } = props;

        // For data points with no mood entry, always position at the bottom of the chart
        if (!payload.hasMoodEntry) {
            // Get the bottom y-coordinate - use yAxis domain if available, otherwise fallback
            const bottomY = (yAxis && yAxis.scale) ? yAxis.scale(0) : (height - 10);

            return (
                <g
                    key={`dot-missing-${index}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDataPointClick(payload);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {/* Invisible hit area */}
                    <circle
                        cx={cx}
                        cy={bottomY}
                        r={20}
                        fill="rgba(0,0,0,0.01)"
                        stroke="none"
                    />
                    {/* Empty circle */}
                    <circle
                        cx={cx}
                        cy={bottomY}
                        r={4}
                        fill="white"
                        stroke="#9CA3AF"
                        strokeWidth={1}
                        strokeDasharray="2,1"
                    />
                </g>
            );
        }

        // Don't render future dates
        if (payload.isFutureDate) {
            return <g key={`dot-future-${index}`} />;
        }

        // For incomplete data, render gray dot
        if (!payload.isComplete) {
            return (
                <g
                    key={`dot-incomplete-${index}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDataPointClick(payload);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {/* Invisible larger hit area */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={20}
                        fill="rgba(0,0,0,0.01)"
                        stroke="none"
                    />
                    {/* Visible dot */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#9CA3AF"
                        stroke="#6B7280"
                        strokeWidth={1}
                    />
                </g>
            );
        }

        // Complete data dot
        return (
            <g
                key={`dot-complete-${index}`}
                style={{ cursor: 'default' }}
            >
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#3B82F6"  // Blue-500 - matching primary blue theme
                    stroke="#fff"
                    strokeWidth={1}
                />
            </g>
        );
    };

    // Custom tooltip component for chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const score = data.wellbeingScore;

            // Only show tooltip for days with actual data
            if (score === null && !data.hasMoodEntry) {
                return (
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 shadow rounded-md">
                        <p className="text-sm font-medium">{data.formattedDate}</p>
                        <p className="text-sm text-neutral-500">No data available</p>
                        <p className="text-xs text-neutral-500 mt-1">Click to add</p>
                    </div>
                );
            }

            if (score === null) return null;

            const hasNote = data.description && data.description.trim().length > 0;

            return (
                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 shadow rounded-md max-w-[260px]">
                    <p className="text-sm font-medium mb-1">{data.formattedDate}</p>

                    {/* Overall score */}
                    {selectedMetrics.includes('wellbeing') && (
                        <p className={`text-sm font-bold ${getScoreColor(score)}`}>
                            Overall Score: {score}
                        </p>
                    )}

                    {/* Individual metrics */}
                    {data.moodRaw !== null && selectedMetrics.includes('mood') && (
                        <p className="text-sm text-amber-500">Mood: {data.moodRaw}/5</p>
                    )}
                    {data.sleepRaw !== null && selectedMetrics.includes('sleep') && (
                        <p className="text-sm text-purple-500">Sleep: {data.sleepRaw}/5</p>
                    )}
                    {data.nutritionRaw !== null && selectedMetrics.includes('nutrition') && (
                        <p className="text-sm text-emerald-500">Nutrition: {data.nutritionRaw}/5</p>
                    )}
                    {data.exerciseRaw !== null && selectedMetrics.includes('exercise') && (
                        <p className="text-sm text-blue-500">Exercise: {data.exerciseRaw}/5</p>
                    )}
                    {data.socialRaw !== null && selectedMetrics.includes('social') && (
                        <p className="text-sm text-pink-500">Social: {data.socialRaw}/5</p>
                    )}

                    {/* Notes section */}
                    {hasNote && (
                        <div className="mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-1">
                            <p className="text-xs text-neutral-500 font-medium">Notes:</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 break-words">
                                {data.description}
                            </p>
                        </div>
                    )}

                    {/* Incomplete data warning */}
                    {!data.isComplete && (
                        <p className="text-xs text-neutral-500 mt-1">
                            {data.isFutureDate
                                ? 'Future date'
                                : 'Incomplete data - Click to update'}
                        </p>
                    )}
                    {!data.isComplete && !data.isFutureDate && data.missingFields.length > 0 && (
                        <p className="text-xs text-neutral-500">
                            Missing: {data.missingFields.join(', ')}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const handleChartClick = (data: any) => {
        if (!data || !data.activePayload || data.activePayload.length === 0) return;

        const payload = data.activePayload[0].payload;
        handleDataPointClick(payload);
    };

    const renderMetricToggle = (metric: string) => {
        const isSelected = selectedMetrics.includes(metric);
        const metricKey = metric as keyof typeof metricColors;
        return (
            <Toggle
                key={metric}
                pressed={isSelected}
                onPressedChange={() => toggleMetric(metric)}
                className={`${isSelected ? 'bg-opacity-20' : 'bg-neutral-100 dark:bg-neutral-800'} border rounded-full px-3 py-1`}
                style={{
                    borderColor: isSelected ? metricColors[metricKey] : 'transparent',
                    backgroundColor: isSelected ? `${metricColors[metricKey]}20` : ''
                }}
            >
                <div className="flex items-center gap-1.5">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: metricColors[metricKey] }}
                    ></span>
                    <span className="text-xs">{metricLabels[metricKey]}</span>
                </div>
            </Toggle>
        );
    };

    return (
        <div className={`space-y-${compactMode ? '4' : '6'}`}>
            {/* Title and Time Range Selection */}
            {!hideTitle && (
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Wellness Score</h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">Track your daily wellness metrics</p>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                                    <InfoIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-2">
                                    <h4 className="font-medium">About Wellness Score</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                        Wellness Score measures your overall wellbeing based on five key metrics.
                                    </p>
                                    <ul className="text-sm text-neutral-600 dark:text-neutral-300 list-disc pl-4 space-y-1">
                                        <li>Each metric is rated on a scale from 1-5</li>
                                        <li>Your overall score is calculated as an average of available metrics</li>
                                        <li>Track individual metrics to see specific trends</li>
                                        <li>Click on any date to add or edit your wellness data</li>
                                    </ul>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {!externalTimeRange && (
                        <Tabs value={timeRange} onValueChange={(value: string) => {
                            if (value === 'week' || value === 'month' || value === 'year') {
                                setTimeRange(value as 'week' | 'month' | 'year');
                            }
                        }} className="w-auto">
                            <TabsList className="bg-neutral-200 dark:bg-neutral-700">
                                <TabsTrigger
                                    value="week"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                                >
                                    Week
                                </TabsTrigger>
                                <TabsTrigger
                                    value="month"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                                >
                                    Month
                                </TabsTrigger>
                                <TabsTrigger
                                    value="year"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                                >
                                    Year
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>
            )}

            {/* Current Score Card */}
            {!compactMode && (
                <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-blue-500 rounded-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md font-medium text-blue-600 dark:text-blue-400">Current Wellness Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <p className={`text-5xl font-bold ${getScoreColor(currentScore)}`}>
                                    {currentScore !== null ? currentScore : '–'}
                                </p>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {currentScore !== null ? 'out of 100' : 'No recent data'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Trend Chart */}
            <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-blue-500 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-blue-600 dark:text-blue-400">Wellness Trend</CardTitle>

                    {/* Add metric filter section */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {renderMetricToggle('wellbeing')}
                        {renderMetricToggle('mood')}
                        {renderMetricToggle('sleep')}
                        {renderMetricToggle('nutrition')}
                        {renderMetricToggle('exercise')}
                        {renderMetricToggle('social')}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={wellbeingData}
                                margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
                                onClick={handleChartClick}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis
                                    dataKey="formattedDate"
                                    tick={{ fontSize: 12 }}
                                    tickMargin={10}
                                    stroke="#6B7280"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                    tickCount={5}
                                    stroke="#6B7280"
                                />
                                <Tooltip content={<CustomTooltip />} />

                                {/* Multiple lines for each metric */}
                                {selectedMetrics.includes('wellbeing') && (
                                    <Line
                                        type="monotone"
                                        dataKey="displayScore"
                                        stroke={metricColors.wellbeing}
                                        strokeWidth={2.5}
                                        dot={renderDot}
                                        activeDot={{
                                            r: 8,
                                            stroke: '#10B981',
                                            strokeWidth: 2,
                                            onClick: (data: any) => {
                                                if (data && data.payload) {
                                                    setTimeout(() => {
                                                        handleDataPointClick(data.payload);
                                                    }, 10);
                                                }
                                            }
                                        }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}

                                {/* Individual metric lines */}
                                {selectedMetrics.includes('mood') && (
                                    <Line
                                        type="monotone"
                                        dataKey="mood"
                                        stroke={metricColors.mood}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 1 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}

                                {selectedMetrics.includes('sleep') && (
                                    <Line
                                        type="monotone"
                                        dataKey="sleep"
                                        stroke={metricColors.sleep}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 1 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}

                                {selectedMetrics.includes('nutrition') && (
                                    <Line
                                        type="monotone"
                                        dataKey="nutrition"
                                        stroke={metricColors.nutrition}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 1 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}

                                {selectedMetrics.includes('exercise') && (
                                    <Line
                                        type="monotone"
                                        dataKey="exercise"
                                        stroke={metricColors.exercise}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 1 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}

                                {selectedMetrics.includes('social') && (
                                    <Line
                                        type="monotone"
                                        dataKey="social"
                                        stroke={metricColors.social}
                                        strokeWidth={1.5}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: 'white', strokeWidth: 1 }}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Keep existing legend with improved styling */}
                    <div className="flex items-center justify-center mt-4 gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Complete</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 rounded-full bg-gray-400"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Incomplete</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full border border-gray-400 bg-white dark:bg-neutral-800"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Missing</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mood Modal for historical data entry */}
            {showMoodModal && selectedDate && (
                <MoodTrackingModal
                    user={user}
                    isOpen={showMoodModal}
                    setIsOpen={setShowMoodModal}
                    selectedDate={selectedDate}
                    dateLabel={getFormattedDateLabel(selectedDate)}
                    onComplete={() => {
                        setShowMoodModal(false);
                        setSelectedDate(null);
                    }}
                />
            )}
        </div>
    );
};

export default WellnessReport;