import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Clock, Play, Calendar, Flame, Music, Timer, GitBranch, Trash2, AlertCircle } from "lucide-react";
import { useFocusSession } from '@/hooks/use-focus-session';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FocusSession } from '@/types/focus-session.types';
import { toast } from "sonner";
import TimeRangeSelector from './TimeRangeSelector';

interface FocusSessionsHistoryProps {
    user: User | null | undefined;
    compactMode?: boolean;
    timeRange?: 'week' | 'month' | 'year' | 'all';
}

const FocusSessionsHistory = ({
    user,
    compactMode = false,
    timeRange: externalTimeRange,
}: FocusSessionsHistoryProps) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>(externalTimeRange || 'week');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<FocusSession | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { recentSessions, fetchRecentSessions, fetchSessionStats, deleteSession } = useFocusSession({ user });
    const [sessionsData, setSessionsData] = useState<any[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<FocusSession[]>([]);
    const [calculatedStats, setCalculatedStats] = useState({
        total_duration: 0,
        average_duration: 0,
        streak_days: 0,
        total_sessions: 0,
        favorite_activity: '',
        sessionsToday: 0
    });

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

            // Calculate stats directly from filtered sessions
            if (validSessions.length > 0) {
                const totalDuration = validSessions.reduce((sum, session) => sum + session.actual_duration, 0);
                const avgDuration = Math.round(totalDuration / validSessions.length);

                // Count activities to find favorite
                const activityCounts: Record<string, number> = {};
                validSessions.forEach(session => {
                    const activity = session.activity || 'none';
                    if (!activityCounts[activity]) activityCounts[activity] = 0;
                    activityCounts[activity]++;
                });

                let favoriteActivity = 'none';
                let maxCount = 0;
                Object.entries(activityCounts).forEach(([activity, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        favoriteActivity = activity;
                    }
                });

                // Calculate streak days
                const sessionDates = validSessions.map(session => {
                    const date = new Date(session.created_at);
                    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                });
                const uniqueDates = [...new Set(sessionDates)].sort();

                // Count streak days (simplified calculation)
                let streakDays = 0;
                if (uniqueDates.length > 0) {
                    const today = new Date();
                    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

                    if (uniqueDates.includes(todayString)) {
                        streakDays = 1;
                        // More accurate streak calculation would need to check consecutive days
                    }
                }

                // Calculate sessions today
                const today = new Date();
                const sessionsToday = validSessions.filter(session => {
                    const sessionDate = new Date(session.created_at);
                    return sessionDate.getDate() === today.getDate() &&
                        sessionDate.getMonth() === today.getMonth() &&
                        sessionDate.getFullYear() === today.getFullYear();
                }).length;

                setCalculatedStats({
                    total_duration: totalDuration,
                    average_duration: avgDuration,
                    streak_days: streakDays,
                    total_sessions: validSessions.length,
                    favorite_activity: favoriteActivity,
                    sessionsToday
                });
            }
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

    // Handle session deletion
    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;

        try {
            setIsDeleting(true);

            // Call the API to delete the session
            await deleteSession(sessionToDelete.id);

            // Show success message
            toast.success("Focus session deleted successfully");

            // Refresh session data
            await fetchRecentSessions();
            await fetchSessionStats();

            // Close the dialog
            setIsDeleteDialogOpen(false);
            setSessionToDelete(null);
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete session. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Open delete confirmation dialog
    const confirmDeleteSession = (session: FocusSession) => {
        setSessionToDelete(session);
        setIsDeleteDialogOpen(true);
    };

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
        totalFocusTime: formatDuration(calculatedStats.total_duration),
        averageDuration: formatDuration(calculatedStats.average_duration),
        streakDays: calculatedStats.streak_days,
        totalSessions: calculatedStats.total_sessions,
        favoriteActivity: calculatedStats.favorite_activity !== 'none' ? calculatedStats.favorite_activity : '—',
        sessionsToday: calculatedStats.sessionsToday
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
            className="flex flex-row sm:items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm gap-2 group"
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
                <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-800 dark:text-white text-right">
                        {formatDuration(session.actual_duration)}
                    </p>

                    {/* Delete button (hidden by default, visible on hover) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteSession(session);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                        title="Delete session"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {session.status === 'completed' ? (
                        <span className="text-neutral-700 dark:text-white/80">Completed</span>
                    ) : (
                        <span className="text-neutral-600 dark:text-white/70">Abandoned</span>
                    )}
                </span>
            </div>
        </div>
    );

    return (
        <>
            <Card className="shadow-md bg-gradient-to-b from-indigo-800 to-purple-900 dark:from-indigo-950 dark:to-purple-950 rounded-xl overflow-hidden">
                <CardHeader className="pb-6 flex flex-row items-center justify-between -mt-4">
                    <CardTitle className="text-md font-bold text-white">
                        Focus sessions history
                    </CardTitle>
                    <TimeRangeSelector
                        value={timeRange === 'all' ? 'all' : timeRange}
                        onChange={(value) => setTimeRange(value)}
                        allowAll={true}
                    />
                </CardHeader>
                <CardContent>
                    {hasNoSessionData ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 text-center">
                            <Clock className="h-16 w-16 text-purple-200 mb-2" />
                            <div className="space-y-4 max-w-md">
                                <h3 className="text-xl font-medium text-white">Start Your First Focus Session</h3>
                                <p className="text-white/70">
                                    Track your focused work time with sessions. Set a timer, choose an activity, and stay focused to build a productive habit.
                                </p>
                                <div className="flex justify-center pt-4">
                                    <Link href="/focus">
                                        <Button
                                            className="bg-white hover:bg-white/90 text-indigo-900 shadow-md hover:shadow-lg transition-all duration-200 border-0"
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
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-white/70 mb-1">Total Focus Time</p>
                                    <p className="text-lg font-semibold text-white">{displayStats.totalFocusTime}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-white/70 mb-1">Avg. Session</p>
                                    <p className="text-lg font-semibold text-white">{displayStats.averageDuration}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-white/70 mb-1">Current Streak</p>
                                    <div className="flex items-center">
                                        <p className="text-lg font-semibold text-white">{displayStats.streakDays}</p>
                                        {displayStats.streakDays > 0 && <Flame className="h-4 w-4 ml-1 text-amber-300" />}
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                    <p className="text-xs text-white/70 mb-1">Focus Sessions Today</p>
                                    <div className="flex items-center">
                                        <p className="text-lg font-semibold text-white">{displayStats.sessionsToday}</p>
                                        <span className="ml-1 text-white/70 text-sm">{displayStats.sessionsToday === 1 ? 'session' : 'sessions'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="w-full h-64 bg-white/5 rounded-xl p-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sessionsData}
                                        margin={{ top: 5, right: 5, left: 5, bottom: 15 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="rgba(255,255,255,0.2)" />
                                        <XAxis
                                            dataKey="displayDate"
                                            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
                                            tickMargin={10}
                                            stroke="rgba(255,255,255,0.3)"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.8)" }}
                                            tickFormatter={(value) => formatDuration(value)}
                                            stroke="rgba(255,255,255,0.3)"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="totalDuration"
                                            name="Focus Time"
                                            fill="url(#focusGradient)"  // Use a gradient instead of solid color
                                            radius={[4, 4, 0, 0]}
                                        />

                                        <defs>
                                            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />  {/* Purple-400 */}
                                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.9} />  {/* Indigo-400 */}
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Recent sessions list */}
                            {!compactMode && filteredSessions.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-white mb-3">Recent Focus Sessions</h4>
                                    <div className="space-y-2">
                                        {filteredSessions.slice(0, 3).map(session => (
                                            <div
                                                key={session.id}
                                                className="flex flex-row sm:items-center justify-between bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-sm gap-2 group"
                                            >
                                                <div className="flex-grow flex items-center gap-3">
                                                    {/* Activity icon with styled container */}
                                                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500/30 backdrop-blur-sm text-xl shadow-inner">
                                                        {getActivityIcon(session.activity)}
                                                    </div>

                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-white">
                                                                {capitalizeFirstLetter(session.activity)}
                                                            </p>
                                                            {/* Session type indicator */}
                                                            {session.flow_mode ?
                                                                <span title="Flow session (untimed)" className="inline-flex items-center text-xs font-medium bg-blue-500/30 px-1.5 py-0.5 rounded">
                                                                    <span className="mr-1">🌊</span> Flow
                                                                </span> :
                                                                <span title="Timed session" className="inline-flex items-center text-xs font-medium bg-indigo-500/30 px-1.5 py-0.5 rounded">
                                                                    <span className="mr-1">⏱️</span> Timed
                                                                </span>
                                                            }
                                                        </div>

                                                        <p className="text-xs text-white/60 mt-0.5">
                                                            {formatTimeRange(session.started_at, session.ended_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right flex flex-col items-end justify-between sm:justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white text-right">
                                                            {formatDuration(session.actual_duration)}
                                                        </p>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                confirmDeleteSession(session);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-500/30 text-red-300"
                                                            title="Delete session"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-white/60">
                                                        {session.status === 'completed' ? (
                                                            <span className="text-white/90">Completed</span>
                                                        ) : (
                                                            <span className="text-white/80">Abandoned</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center mt-4">
                                        <Button
                                            variant="outline"
                                            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-sm hover:shadow transition-all duration-200"
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {/* Gradient Header */}
                            <DialogHeader className="p-0">
                                <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold mb-1 flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-white/90" />
                                        Confirm Deletion
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 m-0">
                                        Are you sure you want to delete this focus session? This action cannot be undone.
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            {/* Content Area */}
                            <div className="p-6">
                                {sessionToDelete && (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        <div className="flex items-center gap-3">
                                            {/* Activity icon with styled container */}
                                            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500/30 backdrop-blur-sm text-xl shadow-inner">
                                                {getActivityIcon(sessionToDelete.activity)}
                                            </div>

                                            <div>
                                                <p className="text-base font-medium">{capitalizeFirstLetter(sessionToDelete.activity)} session</p>
                                                <p className="text-sm text-neutral-500">
                                                    <span className="font-medium">{formatDuration(sessionToDelete.actual_duration)}</span> on {new Date(sessionToDelete.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t dark:border-neutral-800 flex sm:justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDeleteSession}
                                    disabled={isDeleting}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 border-0"
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>Delete Session</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FocusSessionsHistory;