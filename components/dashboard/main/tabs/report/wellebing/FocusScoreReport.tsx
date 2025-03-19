import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Target, Chrome, Settings, Download, Brain } from "lucide-react";
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { DailyFocusData } from '@/types/report.types';
import Link from 'next/link';
import { ManageDistractionsDialog } from './ManageDistractionsDialog';

interface FocusScoreReportProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'year';
}

const FocusScoreReport = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
}: FocusScoreReportProps) => {
    const [timeRange, setTimeRange] = useState(externalTimeRange || 'week');
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

    // Add this function to refresh data after dialog actions
    const refreshData = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { focusData: data, currentScore: score } = await getFocusData(timeRange);
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

    return (
        <div className={`space-y-${compactMode ? '4' : '6'}`}>
            <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-indigo-500 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-indigo-600 dark:text-indigo-400">Focus Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    {hasNoFocusData ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 text-center">
                            <Brain className="h-16 w-16 text-indigo-500 mb-2" />
                            <div className="space-y-4 max-w-md">
                                <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">Track Your Focus</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Focus is tracked using our Chrome extension that helps limit distractions from social networks and other distracting websites. Install the extension to start building better digital habits and improve your focus score.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                                    <a href="https://chrome.google.com/webstore/detail/your-extension-id" target="_blank" rel="noopener noreferrer">
                                        <Button
                                            className="w-full sm:w-auto bg-gradient-to-br from-indigo-800 to-purple-900 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Get Chrome Extension
                                        </Button>
                                    </a>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(true)}
                                        className="border-indigo-600 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Manage distractions {blockedSitesCount > 0 && `(${blockedSitesCount} site blocked)`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
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

                            {/* Manage distractions button for when data exists */}
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(true)}
                                    className="border-indigo-600 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage distractions {blockedSitesCount > 0 && `(${blockedSitesCount} site blocked)`}
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

export default FocusScoreReport;