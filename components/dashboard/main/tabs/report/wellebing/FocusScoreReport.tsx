import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InfoIcon, Target } from "lucide-react";
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { DailyFocusData } from '@/types/report.types';

interface FocusScoreReportProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'year';
    hideTitle?: boolean;
}

const FocusScoreReport = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
    hideTitle = false
}: FocusScoreReportProps) => {
    const [timeRange, setTimeRange] = useState(externalTimeRange || 'week');
    const [focusData, setFocusData] = useState<DailyFocusData[]>([]);
    const [currentScore, setCurrentScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Use the hook
    const { getFocusData } = useBlockedSite({ user });

    // Update time range when external prop changes
    useEffect(() => {
        if (externalTimeRange) {
            setTimeRange(externalTimeRange);
        }
    }, [externalTimeRange]);

    // Get score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-blue-500";
        if (score >= 40) return "text-amber-500";
        return "text-rose-500";
    };

    // Fetch focus data based on time range
    useEffect(() => {
        const loadFocusData = async () => {
            if (!user) return;

            // Use a flag to prevent multiple simultaneous requests
            if (isLoading) return;

            try {
                setIsLoading(true);
                const { focusData: data, currentScore: score } = await getFocusData(timeRange);
                setFocusData(data);
                setCurrentScore(score);
            } finally {
                setIsLoading(false);
            }
        };

        loadFocusData();

        // Set up polling with a reasonable interval (5 minutes)
        const intervalId = setInterval(() => {
            loadFocusData();
        }, 300000);

        return () => {
            clearInterval(intervalId); // Clean up on unmount
        };
    }, [timeRange, user, getFocusData]);

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as DailyFocusData;

            // If no data for this day, show simple tooltip
            if (!data.hasData) {
                return (
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 shadow rounded-md">
                        <p className="text-sm font-medium">{data.formattedDate}</p>
                        <p className="text-sm text-neutral-500">No data available</p>
                    </div>
                );
            }

            // For days with data, show detailed information
            return (
                <div className="bg-neutral-100 dark:bg-neutral-800 p-2 border border-neutral-200 dark:border-neutral-700 shadow rounded-md max-w-[260px]">
                    <p className="text-sm font-medium mb-1">{data.formattedDate}</p>

                    {/* Focus score */}
                    <p className={`text-sm font-bold ${getScoreColor(data.focusScore || 0)}`}>
                        Focus Score: {data.focusScore}
                    </p>

                    {/* Summary
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        Total distractions: {data.attempts} {data.attempts === 1 ? 'time' : 'times'}
                    </p>
                    {data.bypasses > 0 && (
                        <p className="text-sm text-rose-500">
                            Bypassed blocks: {data.bypasses} {data.bypasses === 1 ? 'time' : 'times'}
                        </p>
                    )} */}

                    {/* Details by domain */}
                    {data.attemptDetails.length > 0 && (
                        <div className="mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-1">
                            <p className="text-xs text-neutral-500 font-medium">Attempted sites:</p>
                            <ul className="text-xs text-neutral-600 dark:text-neutral-300">
                                {data.attemptDetails.map(detail => (
                                    <li key={detail.domain} className="flex justify-between gap-4">
                                        <span>{detail.domain}</span>
                                        <span>
                                            <span className={detail.bypasses > 0 ? `text-orange-400` : `text-green-400`}>{detail.bypasses ?? 0}</span> / {detail.attempts}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    // Custom dot renderer for the chart
    const renderDot = (props: any) => {
        const { cx, cy, payload, index } = props;

        // Don't render dots for future dates or days without data
        if (payload.isFutureDate || !payload.hasData || payload.focusScore === null) {
            return <g key={`dot-empty-${index}`} />;
        }

        // Size and color based on focus score
        const color = payload.focusScore >= 80 ? '#10B981' :
            payload.focusScore >= 60 ? '#3B82F6' :
                payload.focusScore >= 40 ? '#F59E0B' : '#EF4444';

        const strokeColor = payload.bypasses > 0 ? '#991B1B' : '#fff';

        const baseRadius = 4;

        // Larger dot for days with more attempts
        const radius = Math.min(
            baseRadius + Math.floor(payload.attempts / 3),
            baseRadius * 2
        );

        return (
            <g key={`dot-${index}`}>
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    stroke="#fff"
                // strokeWidth={payload.bypasses > 0 ? 2 : 1}
                />
                {payload.bypasses > 0 && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 3}
                        fill="none"
                        // stroke="#991B1B"
                        strokeWidth={1}
                    />
                )}
            </g>
        );
    };

    return (
        <div className={`space-y-${compactMode ? '4' : '6'}`}>
            {/* Title and Time Range Selection */}
            {!hideTitle && (
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
                            <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Focus Score</h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">Track your daily focus progress</p>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                                    <InfoIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-2">
                                    <h4 className="font-medium">About Focus Score</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                        Focus Score measures your ability to avoid distractions from blocked websites.
                                    </p>
                                    <ul className="text-sm text-neutral-600 dark:text-neutral-300 list-disc pl-4 space-y-1">
                                        <li>Each attempt to access a blocked site reduces your score by 1 point</li>
                                        <li>Each bypass (when you override a block) reduces your score by 3 points</li>
                                        <li>A perfect score of 100 means no distractions</li>
                                        <li>Your score will never go below 40</li>
                                        <li>Larger dots indicate more distractions</li>
                                        <li>Red outlines indicate bypassed blocks</li>
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
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                                >
                                    Week
                                </TabsTrigger>
                                <TabsTrigger
                                    value="month"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                                >
                                    Month
                                </TabsTrigger>
                                <TabsTrigger
                                    value="year"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
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
                <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-indigo-500 rounded-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md font-medium text-indigo-600 dark:text-indigo-400">Current Focus Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <p className={`text-5xl font-bold ${currentScore !== null ? getScoreColor(currentScore) : 'text-neutral-400'}`}>
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

            {/* Focus Chart */}
            <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-indigo-500 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-indigo-600 dark:text-indigo-400">Focus Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={focusData}
                                margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
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
                                <Line
                                    type="monotone"
                                    dataKey="focusScore"
                                    stroke="#818CF8" // Indigo-400 for consistency
                                    strokeWidth={2}
                                    dot={renderDot}
                                    activeDot={{
                                        r: 8,
                                        strokeWidth: 2,
                                    }}
                                    isAnimationActive={false}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center mt-4 gap-4 text-xs">
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-emerald-500"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Perfect (100)</span>
                        </div>
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-blue-500"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Good (60-80)</span>
                        </div>
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-amber-500"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Fair (40-60)</span>
                        </div>
                        <div className="flex items-center">
                            <span className="inline-block w-3 h-3 mr-1 rounded-full bg-rose-500"></span>
                            <span className="text-neutral-700 dark:text-neutral-300">Poor (0-40)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FocusScoreReport;