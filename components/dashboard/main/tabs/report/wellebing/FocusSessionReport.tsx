import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Clock, Play, Calendar, Flame, Music, Timer, GitBranch } from "lucide-react";
import { useFocusSession } from '@/hooks/use-focus-session';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FocusSession } from '@/types/focus-session.types';

interface FocusSessionsReportProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'all';
}

const FocusSessionsReport = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
}: FocusSessionsReportProps) => {
    const [timeRange, setTimeRange] = useState(externalTimeRange || 'week');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const { recentSessions, fetchRecentSessions, stats, fetchSessionStats } = useFocusSession({ user });
    const [sessionsData, setSessionsData] = useState<any[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<FocusSession[]>([]);

    // Update time range when external prop changes
    useEffect(() => {
        if (externalTimeRange) {
            setTimeRange(externalTimeRange);
        }
    }, [externalTimeRange]);

    // Filter sessions for display (only those > 60 seconds)
    useEffect(() => {
        if (recentSessions.length > 0) {
            const validSessions = recentSessions.filter(session =>
                session.actual_duration >= 60
            );
            setFilteredSessions(validSessions);
        } else {
            setFilteredSessions([]);
        }
    }, [recentSessions]);

    // Convert sessions to chart data format
    useEffect(() => {
        if (recentSessions.length > 0) {
            // Define interface for the accumulator
            interface SessionDay {
                date: string;
                displayDate: string;
                totalDuration: number;
                completedSessions: number;
                abandonedSessions: number;
                sessions: any[]; // Replace with proper session type if available
            }

            interface SessionsByDay {
                [dateKey: string]: SessionDay;
            }

            // Group by day, but only include sessions > 60 seconds
            const sessionsByDay = recentSessions
                .filter(session => session.actual_duration >= 60)
                .reduce((acc: SessionsByDay, session) => {
                    const date = new Date(session.created_at);
                    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

                    if (!acc[dateKey]) {
                        acc[dateKey] = {
                            date: dateKey,
                            displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            totalDuration: 0,
                            completedSessions: 0,
                            abandonedSessions: 0,
                            sessions: []
                        };
                    }

                    acc[dateKey].totalDuration += session.actual_duration;
                    if (session.status === 'completed') {
                        acc[dateKey].completedSessions += 1;
                    } else if (session.status === 'abandoned') {
                        acc[dateKey].abandonedSessions += 1;
                    }

                    acc[dateKey].sessions.push(session);

                    return acc;
                }, {} as SessionsByDay);

            // Convert to array and sort by date
            const data = Object.values(sessionsByDay).sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            setSessionsData(data);
        } else {
            setSessionsData([]);
        }
    }, [recentSessions]);

    // Fetch session data based on time range
    useEffect(() => {
        const loadSessionsData = async () => {
            if (!user) return;
            if (isLoading) return;

            try {
                setIsLoading(true);

                // Determine how many sessions to fetch based on time range
                const limit = timeRange === 'week' ? 50 : timeRange === 'month' ? 150 : 500;

                await fetchRecentSessions(limit);
                await fetchSessionStats();
            } finally {
                setIsLoading(false);
            }
        };

        loadSessionsData();
    }, [timeRange, user, fetchRecentSessions, fetchSessionStats]);

    // Format duration in minutes and hours
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}m`;
    };

    // Format time in 12-hour format with AM/PM
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date range (e.g., "10:30 AM - 11:45 AM")
    const formatTimeRange = (startTime: string, endTime: string | null) => {
        if (!endTime) return `${formatTime(startTime)} - ongoing`;
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    // Get icon for the sound/music
    const getSoundIcon = (sound: string) => {
        switch (sound.toLowerCase()) {
            case 'none':
                return null;
            default:
                return <Music className="h-3 w-3 text-purple-400" />;
        }
    };

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="bg-neutral-100 dark:bg-neutral-800 p-3 border border-neutral-200 dark:border-neutral-700 shadow rounded-md">
                    <p className="text-sm font-medium mb-1">{data.displayDate}</p>
                    <p className="text-xs text-neutral-500">Total focus time: <span className="font-medium text-purple-600 dark:text-purple-400">{formatDuration(data.totalDuration)}</span></p>
                    <p className="text-xs text-neutral-500">Completed: <span className="font-medium text-emerald-600 dark:text-emerald-400">{data.completedSessions}</span></p>
                    <p className="text-xs text-neutral-500">Abandoned: <span className="font-medium text-amber-600 dark:text-amber-400">{data.abandonedSessions}</span></p>
                </div>
            );
        }

        return null;
    };

    // Calculate stats to display
    const displayStats = {
        totalFocusTime: stats ? formatDuration(stats.total_duration) : '0m',
        averageDuration: stats ? formatDuration(stats.average_duration) : '0m',
        streakDays: stats ? stats.streak_days : 0,
        totalSessions: stats ? stats.total_sessions : 0,
        favoriteActivity: stats && stats.favorite_activity !== 'none' ? stats.favorite_activity : '—',
        sessionsToday: filteredSessions.filter(session => {
            const sessionDate = new Date(session.created_at);
            const today = new Date();
            return sessionDate.getDate() === today.getDate() &&
                sessionDate.getMonth() === today.getMonth() &&
                sessionDate.getFullYear() === today.getFullYear();
        }).length
    };

    const hasNoSessionData = !isLoading && (!filteredSessions || filteredSessions.length === 0);

    // Get activity icon emoji
    const getActivityIcon = (activity: string) => {
        switch (activity.toLowerCase()) {
            case 'study': return '📚';
            case 'work': return '💼';
            case 'code': return '💻';
            case 'draw': return '🎨';
            case 'read': return '📖';
            case 'write': return '✍️';
            case 'meditate': return '🧘';
            case 'exercise': return '🏋️';
            default: return '🧠';
        }
    };

    // Capitalize first letter of a string
    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Render a single session item (used in both the main view and dialog)
    const renderSessionItem = (session: FocusSession) => (
        <div
            key={session.id}
            className="flex flex-row sm:items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm gap-2"
        >
            <div className="flex-grow flex items-center gap-3">
                {/* Activity icon with styled container */}
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 backdrop-blur-sm text-xl shadow-inner">
                    {getActivityIcon(session.activity)}
                </div>

                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                            {capitalizeFirstLetter(session.activity)}
                        </p>
                        {/* Session type indicator with more descriptive icons */}
                        {session.flow_mode ?
                            <span title="Flow session (untimed)" className="inline-flex items-center text-xs font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                <span className="mr-1">🌊</span> Flow
                            </span> :
                            <span title="Timed session" className="inline-flex items-center text-xs font-medium text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                <span className="mr-1">⏱️</span> Timed
                            </span>
                        }
                    </div>

                    {/* Time range */}
                    <p className="text-xs text-neutral-500 mt-0.5">
                        {formatTimeRange(session.started_at, session.ended_at)}
                    </p>
                </div>
            </div>

            <div className="text-right flex flex-col items-end justify-between sm:justify-center">
                <p className={`font-medium ${session.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatDuration(session.actual_duration)}
                </p>
                <p className="text-xs text-neutral-500">
                    {session.status === 'completed' ? 'Completed' : 'Abandoned'}
                </p>
            </div>
        </div>
    );

    return (
        <>
            <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-purple-500 rounded-xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-purple-600 dark:text-purple-400">Focus Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    {hasNoSessionData ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 text-center">
                            <Clock className="h-16 w-16 text-purple-500 mb-2" />
                            <div className="space-y-4 max-w-md">
                                <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">Start Your First Focus Session</h3>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Track your focused work time with sessions. Set a timer, choose an activity, and stay focused to build a productive habit.
                                </p>
                                <div className="flex justify-center pt-4">
                                    <Link href="/focus">
                                        <Button
                                            className="bg-gradient-to-br from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Start a Focus Session
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-neutral-500 mb-1">Total Focus Time</p>
                                    <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">{displayStats.totalFocusTime}</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-neutral-500 mb-1">Avg. Session</p>
                                    <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">{displayStats.averageDuration}</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-neutral-500 mb-1">Current Streak</p>
                                    <div className="flex items-center">
                                        <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">{displayStats.streakDays}</p>
                                        {displayStats.streakDays > 0 && <Flame className="h-4 w-4 ml-1 text-amber-500" />}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-neutral-500 mb-1">Focus Sessions Today</p>
                                    <div className="flex items-center">
                                        <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">{displayStats.sessionsToday}</p>
                                        <span className="ml-1 text-neutral-500 text-sm">{displayStats.sessionsToday === 1 ? 'session' : 'sessions'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sessionsData}
                                        margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis
                                            dataKey="displayDate"
                                            tick={{ fontSize: 12 }}
                                            tickMargin={10}
                                            stroke="#6B7280"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => formatDuration(value)}
                                            stroke="#6B7280"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="totalDuration"
                                            name="Focus Time"
                                            fill="#9F7AEA" // Purple-400
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Recent sessions list - only show in non-compact mode - limit to 3 */}
                            {!compactMode && filteredSessions.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Recent Focus Sessions</h4>
                                    <div className="space-y-2">
                                        {filteredSessions.slice(0, 3).map(renderSessionItem)}
                                    </div>
                                    <div className="text-center mt-4">
                                        <Button
                                            variant="outline"
                                            className="border-purple-600 text-purple-600 hover:bg-purple-100 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-950"
                                            onClick={() => setIsHistoryDialogOpen(true)}
                                        >
                                            View All Sessions
                                            <Calendar className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Session History Dialog */}
            {/* Session History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {/* Gradient Header */}
                            <DialogHeader className="p-0">
                                <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold mb-1">Focus Session History</DialogTitle>
                                    <p className="opacity-80">Track your progress and review past focus sessions</p>
                                </div>
                            </DialogHeader>

                            {/* Content Area */}
                            <div className="p-6">
                                {filteredSessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Clock className="h-16 w-16 text-purple-300 mb-2" />
                                        <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">No Focus Sessions</h3>
                                        <p className="text-sm text-neutral-500 mt-2 max-w-xs">You haven't completed any focus sessions yet. Start a session to build your focus history.</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[60vh] pr-4">
                                        <div className="space-y-4 py-2">
                                            {/* Group sessions by date */}
                                            {Object.entries(filteredSessions.reduce((groups: { [date: string]: FocusSession[] }, session) => {
                                                const date = new Date(session.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                });

                                                if (!groups[date]) {
                                                    groups[date] = [];
                                                }

                                                groups[date].push(session);
                                                return groups;
                                            }, {})).map(([date, sessions]) => (
                                                <div key={date} className="mb-6">
                                                    {/* Date header with gradient pill styling */}
                                                    <div className="flex items-center mb-3">
                                                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 rounded-full text-white text-sm font-medium shadow-sm">
                                                            {date}
                                                        </div>
                                                        <div className="h-px bg-neutral-200 dark:bg-neutral-700 flex-grow ml-3"></div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {sessions.map(renderSessionItem)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t dark:border-neutral-800">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsHistoryDialogOpen(false)}
                                    className="w-full"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FocusSessionsReport;