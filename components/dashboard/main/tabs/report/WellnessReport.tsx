import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay, isToday, isFuture, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useMood from '@/hooks/use-mood';
import MoodTrackingModal from '@/components/dashboard/main/moodTracking/MoodTrackingModal';

interface WellnessReportProps {
    user: User | null | undefined;
}

interface DailyScore {
    date: string;
    formattedDate: string;
    wellbeingScore: number | null;
    isComplete: boolean;
    isFutureDate: boolean;
    hasData: boolean;
    missingFields: string[];
}

const WellnessReport = ({ user }: WellnessReportProps) => {
    const [timeRange, setTimeRange] = useState('week');
    const [wellbeingData, setWellbeingData] = useState<DailyScore[]>([]);
    const [currentScore, setCurrentScore] = useState<number | null>(null);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const { getMoodHistory } = useMood({ user });

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
                    item => format(new Date(item.created_at), 'yyyy-MM-dd') === dateStr
                );

                // Check if we have any data for this day
                const hasData = !!dayData;

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

                // Check if the data is complete (all metrics have values)
                const isComplete = hasData && missingFields.length === 0;

                // Check if this is a future date
                const isFutureDate = isFuture(date) || isToday(date);

                return {
                    date: dateStr,
                    formattedDate: format(date, 'MMM dd'),
                    wellbeingScore,
                    isComplete,
                    isFutureDate,
                    hasData,
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

    // Handle clicking on a data point
    const handleDataPointClick = (data: any) => {
        console.log("Dot clicked:", data);

        // Only allow clicking on past dates that have some data but are incomplete
        if (data && !data.isFutureDate && data.hasData && !data.isComplete) {
            setSelectedDate(data.date);
            setShowMoodModal(true);
        }
    };


    const renderDot = (props: any) => {
        const { cx, cy, payload, index } = props;

        // Don't render dots for null scores
        if (payload.wellbeingScore === null) {
            return <g key={`dot-null-${index}`} />;
        }

        // Determine if the dot should be interactive
        const isInteractive = !payload.isFutureDate && payload.hasData && !payload.isComplete;

        if (!payload.isComplete) {
            // Gray dot for incomplete data
            return (
                <g
                    key={`dot-incomplete-${index}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDataPointClick(payload);
                    }}
                    style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                >
                    {/* Invisible larger hit area - much bigger for better clickability */}
                    {isInteractive && (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={20}  // Increased from 10 to 20
                            fill="rgba(0,0,0,0.01)" // Nearly invisible but still clickable
                            stroke="none"
                        />
                    )}

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

        // Default blue dot for complete data
        return (
            <g
                key={`dot-complete-${index}`}
                style={{ cursor: 'default' }}
            >
                <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="var(--weko-blue)"
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

            if (score === null) return null;

            return (
                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 shadow rounded-md">
                    <p className="text-sm font-medium">{data.formattedDate}</p>
                    <p className={`text-sm font-bold ${getScoreColor(score)}`}>
                        Score: {score}
                    </p>
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


    return (
        <div className="space-y-6">
            {/* Time Range Selection */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Wellbeing Score</h3>
                <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Current Score Card */}
            <Card className="bg-neutral-50 dark:bg-neutral-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">Current Wellbeing Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <p className={`text-5xl font-bold ${getScoreColor(currentScore)}`}>
                                {currentScore !== null ? currentScore : '–'}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">out of 100</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card className="bg-neutral-50 dark:bg-neutral-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium">Wellbeing Trend</CardTitle>
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
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                    tickCount={5}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="wellbeingScore"
                                    stroke="var(--weko-blue)"
                                    strokeWidth={2.5}
                                    dot={renderDot}
                                    activeDot={{
                                        r: 8,  // Increased from 6 to 8
                                        stroke: 'var(--weko-green)',
                                        strokeWidth: 2,
                                        onClick: (data: any) => {
                                            if (data && data.payload) {
                                                // Use a small delay to avoid conflicts with other click events
                                                setTimeout(() => {
                                                    handleDataPointClick(data.payload);
                                                }, 10);
                                            }
                                        }
                                    }}
                                    connectNulls
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center mt-4 space-x-6 text-xs">
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-[var(--weko-blue)]"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Complete</span>
                        </div>
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-gray-400"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Incomplete</span>
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