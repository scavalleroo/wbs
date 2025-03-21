import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Target, Chrome, Settings, Download, Brain } from "lucide-react";
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { DailyFocusData } from '@/types/report.types';
import { ManageDistractionsDialog } from './ManageDistractionsDialog';
import { getScoreTier } from '@/components/ui/score';
import TimeRangeSelector from './TimeRangeSelector';

interface DigitalWellbeingHistoryProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'year';
}

const DigitalWellbeingHistory = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
}: DigitalWellbeingHistoryProps) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>(externalTimeRange || 'week');
    const [focusData, setFocusData] = useState<DailyFocusData[]>([]);
    const [currentScore, setCurrentScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [blockedSitesCount, setBlockedSitesCount] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { getFocusData, getBlockedSitesCount } = useBlockedSite({ user });

    // Update time range when external prop changes
    useEffect(() => {
        if (externalTimeRange) {
            setTimeRange(externalTimeRange);
        }
    }, [externalTimeRange]);

    // Fetch focus data based on time range
    useEffect(() => {
        const loadFocusData = async () => {
            if (!user) return;

            // Use a flag to prevent multiple simultaneous requests
            if (isLoading) return;

            try {
                setIsLoading(true);
                const { focusData: data, currentScore: score } = await getFocusData(
                    timeRange === 'all' ? undefined : timeRange
                );
                setFocusData(data);
                setCurrentScore(score);

                // Get the count of blocked sites
                const count = await getBlockedSitesCount();
                setBlockedSitesCount(count);
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
    }, [timeRange, user, getFocusData, getBlockedSitesCount]);

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as DailyFocusData;

            // If no data for this day, show simple tooltip
            if (!data.hasData) {
                return (
                    <div className="bg-white dark:bg-neutral-800 p-3 border border-neutral-200 dark:border-neutral-700 shadow-lg rounded-md">
                        <p className="text-sm font-medium">{data.formattedDate}</p>
                        <p className="text-sm text-neutral-500">No data available</p>
                    </div>
                );
            }

            // For days with data, show detailed information
            const { tier, color } = data.focusScore !== null ?
                getScoreTier(data.focusScore) :
                { tier: "No data", color: "#6B7280" };

            return (
                <div className="bg-white dark:bg-neutral-800 p-3 border border-neutral-200 dark:border-neutral-700 shadow-lg rounded-md max-w-[260px]">
                    <p className="text-sm font-medium mb-1">{data.formattedDate}</p>

                    {/* Focus score using the consistent color from getScoreTier */}
                    <p className="text-sm font-bold" style={{ color }}>
                        Focus Score: {data.focusScore} <span className="text-xs font-normal">({tier})</span>
                    </p>

                    {/* Details by domain */}
                    {data.attemptDetails.length > 0 && (
                        <div className="mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-1">
                            <p className="text-xs text-neutral-500 font-medium">Attempted sites:</p>
                            <ul className="text-xs text-neutral-600 dark:text-neutral-300">
                                {data.attemptDetails.map(detail => (
                                    <li key={detail.domain} className="flex justify-between gap-4">
                                        <span>{detail.domain}</span>
                                        <span>
                                            <span className={detail.bypasses > 0 ? `text-rose-500 dark:text-rose-400` : `text-emerald-500 dark:text-emerald-400`}>{detail.bypasses ?? 0}</span> / {detail.attempts}
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

        // Get color based on score tier
        const { color } = getScoreTier(payload.focusScore);

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
                    stroke="#FFFFFF"
                    strokeWidth={1}
                />
                {payload.bypasses > 0 && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 3}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth={1}
                    />
                )}
            </g>
        );
    };

    // Add this function to refresh data after dialog actions
    const refreshData = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { focusData: data, currentScore: score } = await getFocusData(
                timeRange === 'all' ? undefined : timeRange
            );
            setFocusData(data);
            setCurrentScore(score);

            // Get the count of blocked sites
            const count = await getBlockedSitesCount();
            setBlockedSitesCount(count);
        } finally {
            setIsLoading(false);
        }
    };

    const hasNoFocusData = !isLoading &&
        (!focusData ||
            focusData.length === 0 ||
            !focusData.some(entry => entry.hasData && entry.focusScore !== null));

    // Get the line color for the chart (use white for dark background)
    const chartLineColor = "rgba(255, 255, 255, 0.8)";

    return (
        <div className={`space-y-${compactMode ? '4' : '6'}`}>
            <Card className="shadow-md bg-gradient-to-b from-indigo-800 to-purple-900 dark:from-indigo-950 dark:to-purple-950 rounded-xl overflow-hidden">
                <CardHeader className="pb-6 flex flex-row items-center justify-between -mt-4">
                    <CardTitle className="text-md font-bold text-white">
                        Digital wellbeing history
                    </CardTitle>
                    <TimeRangeSelector
                        value={timeRange}
                        onChange={(value) => setTimeRange(value)}
                    />
                </CardHeader>
                <CardContent>
                    {hasNoFocusData ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 text-center">
                            <Brain className="h-16 w-16 text-white/80 mb-2" />
                            <div className="space-y-4 max-w-md">
                                <h3 className="text-xl font-medium text-white">Track Your Focus</h3>
                                <p className="text-white/70">
                                    Focus is tracked using our Chrome extension that helps limit distractions from social networks and other distracting websites. Install the extension to start building better digital habits and improve your focus score.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                                    <a href="https://chrome.google.com/webstore/detail/your-extension-id" target="_blank" rel="noopener noreferrer">
                                        <Button
                                            className="w-full sm:w-auto bg-white hover:bg-white/90 text-indigo-900 shadow-md hover:shadow-lg transition-all duration-200 border-0"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Get Chrome Extension
                                        </Button>
                                    </a>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(true)}
                                        className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-sm hover:shadow transition-all duration-200">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Manage distractions {blockedSitesCount > 0 && `(${blockedSitesCount} site blocked)`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full h-64 bg-white/5 rounded-xl p-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={focusData}
                                        margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="rgba(255,255,255,0.2)" />
                                        <XAxis
                                            dataKey="formattedDate"
                                            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
                                            tickMargin={10}
                                            stroke="rgba(255,255,255,0.3)"
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
                                            tickCount={5}
                                            stroke="rgba(255,255,255,0.3)"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="focusScore"
                                            stroke={chartLineColor}
                                            strokeWidth={2}
                                            dot={renderDot}
                                            activeDot={{
                                                r: 8,
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                            isAnimationActive={false}
                                            connectNulls={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Score Range Legend using the consistent colors from getScoreTier */}
                            <div className="flex flex-wrap items-center justify-center mt-4 gap-4 text-xs">
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#3B82F6" }}></span>
                                    <span className="text-white">Superior (96-100)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#22C55E" }}></span>
                                    <span className="text-white">Excellent (81-95)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#84CC16" }}></span>
                                    <span className="text-white">Good (61-80)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#EAB308" }}></span>
                                    <span className="text-white">Fair (41-60)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#F97316" }}></span>
                                    <span className="text-white">Poor (21-40)</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: "#EF4444" }}></span>
                                    <span className="text-white">Very Poor (0-20)</span>
                                </div>
                            </div>

                            {/* Manage distractions button for when data exists */}
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(true)}
                                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-sm hover:shadow transition-all duration-200">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage distractions {blockedSitesCount > 0 && `(${blockedSitesCount} ${blockedSitesCount === 1 ? 'site' : 'sites'} blocked)`}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add the dialog component */}
            <ManageDistractionsDialog
                user={user}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                blockedSitesCount={blockedSitesCount}
                onBlockedSitesUpdated={refreshData}
            />
        </div>
    );
};

export default DigitalWellbeingHistory;