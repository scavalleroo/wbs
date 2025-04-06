'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import 'react-circular-progressbar/dist/styles.css';
import { useUserGoals } from '@/hooks/use-user-goals';
import { useFocusSession } from '@/hooks/use-focus-session';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import useMood from '@/hooks/use-mood';
import { useTimer } from '@/contexts/TimerProvider';
import { FocusSelector } from '@/components/timer/FocusSelector';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { Trophy } from 'lucide-react';
import { ManageDistractionsDialog } from './wellebing/ManageDistractionsDialog';
import { useRouter } from 'next/navigation';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import MoodTrackingModal from "@/components/moodTracking/MoodTrackingModal";
import FocusTimeCard from './cards/FocusTimeCard';
import DistractionsCard from './cards/DistractionsCard';
import WellbeingCard from './cards/WellbeingCard';

interface DashboardComponetProps {
    user: User | null | undefined;
}

const formatMinutesToHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
};

const DashboardComponet = ({ user }: DashboardComponetProps) => {
    // Your existing state setup and hooks...
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
    const { todayGoal, loading: goalsLoading, getTodayGoal, updateGoal, getTodayProgress, calculateStreak, goalStreak } = useUserGoals({ user });
    const { recentSessions, fetchRecentSessions } = useFocusSession({ user });
    const { getBlockedSiteStats, getFocusData, getBlockedSitesCount, getBlockedSitesWithTimeAllowance } = useBlockedSite({ user });
    const { getMoodHistory } = useMood({ user });
    const [focusDialogOpen, setFocusDialogOpen] = useState(false);
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [distDialogOpen, setDistDialogOpen] = useState(false);
    const [moodDialogOpen, setMoodDialogOpen] = useState(false);
    const [todayProgress, setTodayProgress] = useState<any>(null);
    const [isEditingFocusGoal, setIsEditingFocusGoal] = useState(false);
    const [newFocusGoal, setNewFocusGoal] = useState(120); // Default 2 hours
    const [newDistractionsGoal, setNewDistractionsGoal] = useState(30); // Default 30 minutes
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [hasRecentMoodData, setHasRecentMoodData] = useState(true);
    const [blockedSitesCount, setBlockedSitesCount] = useState(0);
    const [blockedSitesWithTime, setBlockedSitesWithTime] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Timer context
    const {
        initializeSession,
        timeRemaining,
        timeElapsed,
        isRunning,
        flowMode,
        activity,
        sound
    } = useTimer();

    const { setShowFullScreenTimer } = useTimerUI();

    // Load all data on mount
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // Reload data when focus sessions change
    useEffect(() => {
        if (todayProgress) {
            getTodayProgress().then(progress => {
                if (progress) {
                    setTodayProgress(progress);
                }
            });
        }
    }, [timeRemaining, timeElapsed, isRunning, flowMode]);

    const loadData = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            // 1. Get today's goal and progress
            const progress = await getTodayProgress();
            if (progress) {
                setTodayProgress(progress);
                setNewFocusGoal(progress.focusGoalMinutes);
                setNewDistractionsGoal(progress.distractionGoalMinutes);
            }

            // 2. Get streak
            await calculateStreak();

            // 3. Get recent sessions
            await fetchRecentSessions(50);

            // 4. Get wellness score
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 7);
            const moodHistory = await getMoodHistory(startDate.toISOString(), today.toISOString());

            // Check if user has recent mood data (from last 24 hours)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const hasRecent = moodHistory.some(entry =>
                new Date(entry.tracked_date) > yesterday
            );
            setHasRecentMoodData(hasRecent);

            if (moodHistory && moodHistory.length > 0) {
                const sortedHistory = [...moodHistory].sort((a, b) =>
                    new Date(b.tracked_date).getTime() - new Date(a.tracked_date).getTime()
                );

                // Find first entry with data
                for (const entry of sortedHistory) {
                    const values = [
                        entry.mood_rating,
                        entry.sleep_rating,
                        entry.nutrition_rating,
                        entry.exercise_rating,
                        entry.social_rating
                    ].filter(v => v !== null);

                    if (values.length > 0) {
                        const pointsPerMetric = 100 / values.length;
                        let calculatedScore = 0;

                        if (entry.mood_rating !== null)
                            calculatedScore += (entry.mood_rating / 5) * pointsPerMetric;
                        if (entry.sleep_rating !== null)
                            calculatedScore += (entry.sleep_rating / 5) * pointsPerMetric;
                        if (entry.nutrition_rating !== null)
                            calculatedScore += (entry.nutrition_rating / 5) * pointsPerMetric;
                        if (entry.exercise_rating !== null)
                            calculatedScore += (entry.exercise_rating / 5) * pointsPerMetric;
                        if (entry.social_rating !== null)
                            calculatedScore += (entry.social_rating / 5) * pointsPerMetric;

                        setWellnessScore(Math.round(calculatedScore));
                        break;
                    }
                }
            } else {
                setHasRecentMoodData(false);
            }

            // 5. Get blocked sites count
            const count = await getBlockedSitesCount();
            setBlockedSitesCount(count);

            // 6. Get sites with time allowances
            const sitesWithTime = await getBlockedSitesWithTimeAllowance();
            setBlockedSitesWithTime(sitesWithTime);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle updating goals
    const handleSaveFocusGoal = async () => {
        if (!todayGoal || !todayProgress) return;

        const result = await updateGoal(todayProgress.goalId, {
            focus_time_minutes: newFocusGoal
        });

        if (result) {
            setIsEditingFocusGoal(false);
            // Reload progress
            const progress = await getTodayProgress();
            if (progress) {
                setTodayProgress(progress);
            }
        }
    };

    // Handle focus session start
    const handleStartFocus = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration,
            volume: settings.volume,
            flowMode: settings.flowMode
        });

        setFocusDialogOpen(false);
    };

    // Check if timer is active
    const isTimerActive = (flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning);

    // Format current timer status for display
    const getTimerStatusText = () => {
        if (!isTimerActive) return "Not active";

        if (flowMode) {
            return `Flow mode: ${formatDuration(
                intervalToDuration({ start: 0, end: timeElapsed * 1000 })
            )}`;
        }

        return `${formatDuration(
            intervalToDuration({ start: 0, end: timeRemaining * 1000 })
        )} remaining`;
    };

    const getWellnessEmoji = (score: number | null) => {
        if (score === null) return '📝';
        if (score >= 90) return '🌟';
        if (score >= 75) return '😊';
        if (score >= 60) return '😌';
        if (score >= 45) return '😐';
        if (score >= 30) return '😕';
        return '😔';
    };

    // Get time-based greeting based on current hour
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return 'Good morning';
        } else if (hour >= 12 && hour < 18) {
            return 'Good afternoon';
        } else if (hour >= 18 && hour < 22) {
            return 'Good evening';
        } else {
            return 'Good night';
        }
    };

    // Helper function to get just the first name
    const getFirstName = (user: User | null | undefined): string => {
        if (!user) return 'there';

        // Try to get name from user metadata
        if (user.user_metadata?.full_name) {
            // Split full name and return just the first part
            return user.user_metadata.full_name.split(' ')[0];
        }

        // If no full name, try to use email
        if (user.email) {
            return user.email.split('@')[0];
        }

        // Fallback
        return 'there';
    };

    return (
        <div className="space-y-6 py-6">
            {/* Today's Date and Greeting */}
            <div className="mb-6 px-4 sm:px-0">
                <h1 className="text-3xl font-bold mb-1">
                    {getTimeBasedGreeting()}, {getFirstName(user)}!
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <p className="text-lg text-muted-foreground">
                        {format(new Date(), 'EEEE, MMMM d')}
                    </p>

                    {goalStreak > 0 && (
                        <>
                            <span className="hidden sm:inline text-muted-foreground">•</span>
                            <p className="text-muted-foreground text-lg">
                                <span className="flex items-center">
                                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                                    {goalStreak} day{goalStreak !== 1 ? 's' : ''} streak!
                                </span>
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Main Cards */}
            {/* Cards Layout - Each in its own row */}
            <div className="space-y-6">
                {/* Focus Time Card - First Row */}
                <FocusTimeCard
                    isLoading={isLoading}
                    todayProgress={todayProgress}
                    isTimerActive={isTimerActive}
                    isEditingFocusGoal={isEditingFocusGoal}
                    newFocusGoal={newFocusGoal}
                    onNewFocusGoalChange={(value) => setNewFocusGoal(value)}
                    onEditGoalClick={() => setIsEditingFocusGoal(true)}
                    onSaveGoalClick={handleSaveFocusGoal}
                    onStartFocusClick={() => setFocusDialogOpen(true)}
                    onResumeFocusClick={() => setShowFullScreenTimer(true)}
                    getTimerStatusText={getTimerStatusText}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    user={user}
                />

                {/* Distractions Card - Second Row */}
                <DistractionsCard
                    isLoading={isLoading}
                    todayProgress={todayProgress}
                    blockedSitesCount={blockedSitesCount}
                    blockedSitesWithTime={blockedSitesWithTime}
                    onManageDistractionsClick={() => setDistDialogOpen(true)}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    user={user}
                />

                {/* Wellbeing Card - Third Row */}
                <WellbeingCard
                    isLoading={isLoading}
                    wellnessScore={wellnessScore}
                    hasRecentMoodData={hasRecentMoodData}
                    getWellnessEmoji={getWellnessEmoji}
                    onTrackMoodClick={() => setMoodDialogOpen(true)}
                    user={user}
                />
            </div>

            {/* Focus Dialog */}
            {focusDialogOpen && (
                <FocusSelector
                    onStart={handleStartFocus}
                    onClose={() => setFocusDialogOpen(false)}
                />
            )}

            {/* Distractions Dialog */}
            <ManageDistractionsDialog
                user={user}
                isOpen={distDialogOpen}
                onOpenChange={setDistDialogOpen}
                blockedSitesCount={blockedSitesCount}
                onBlockedSitesUpdated={loadData}
            />

            {/* Mood Dialog */}
            {moodDialogOpen && (
                <MoodTrackingModal
                    user={user}
                    isOpen={moodDialogOpen}
                    setIsOpen={setMoodDialogOpen}
                    onComplete={() => {
                        loadData();
                        setHasRecentMoodData(true);
                    }}
                />
            )}
        </div>
    );
};

export default DashboardComponet;