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
import { Trophy, ShieldBan } from 'lucide-react';
import { ManageDistractionsDialog } from './wellebing/ManageDistractionsDialog';
import { useRouter } from 'next/navigation';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import MoodTrackingModal from "@/components/moodTracking/MoodTrackingModal";
import { OptimizedFocusTimeCard } from './cards/OptimizedFocusTimeCard';
import { OptimizedDistractionsCard } from './cards/OptimizedDistractionsCard';
import { OptimizedWellbeingCard } from './cards/OptimizedWellbeingCard';
import { Button } from '../ui/button';
import { BlockedSite } from '@/types/report.types';

interface DashboardComponetProps {
    user: User | null | undefined;
}

interface SiteStat {
    domain: string;
    todayCount: number;
    todayTimeSeconds: number;
}

const formatMinutesToHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
};

const DashboardComponet = ({ user }: DashboardComponetProps) => {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
    const { todayGoal, loading: goalsLoading, getTodayGoal, updateGoal, getTodayProgress, calculateStreak, goalStreak } = useUserGoals({ user });
    const { recentSessions, fetchRecentSessions } = useFocusSession({ user });
    const { getBlockedSiteStats, getFocusData, getBlockedSitesCount, fetchBlockedSites, getBlockedSitesWithTimeAllowance } = useBlockedSite({ user });
    const { getMoodHistory } = useMood({ user });
    const [focusDialogOpen, setFocusDialogOpen] = useState(false);
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [distDialogOpen, setDistDialogOpen] = useState(false);
    const [moodDialogOpen, setMoodDialogOpen] = useState(false);
    const [todayProgress, setTodayProgress] = useState<any>(null);
    const [isEditingFocusGoal, setIsEditingFocusGoal] = useState(false);
    const [newFocusGoal, setNewFocusGoal] = useState(120);
    const [newDistractionsGoal, setNewDistractionsGoal] = useState(30);
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [hasRecentMoodData, setHasRecentMoodData] = useState(true);
    const [blockedSitesCount, setBlockedSitesCount] = useState(0);
    const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
    const [siteStats, setSiteStats] = useState<SiteStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

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
            const progress = await getTodayProgress();
            if (progress) {
                setTodayProgress(progress);
                setNewFocusGoal(progress.focusGoalMinutes);
                setNewDistractionsGoal(progress.distractionGoalMinutes);
            }

            await calculateStreak();
            await fetchRecentSessions(50);

            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 7);
            const moodHistory = await getMoodHistory(startDate.toISOString(), today.toISOString());

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

            const count = await getBlockedSitesCount();
            setBlockedSitesCount(count);

            const sites = await fetchBlockedSites();
            setBlockedSites(sites);

            const stats = await getBlockedSiteStats();
            setSiteStats(stats as SiteStat[]);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveFocusGoal = async () => {
        if (!todayGoal || !todayProgress) return;

        const result = await updateGoal(todayProgress.goalId, {
            focus_time_minutes: newFocusGoal
        });

        if (result) {
            setIsEditingFocusGoal(false);
            const progress = await getTodayProgress();
            if (progress) {
                setTodayProgress(progress);
            }
        }
    };

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

    const isTimerActive = (flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning);

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

    const getFirstName = (user: User | null | undefined): string => {
        if (!user) return 'there';

        if (user.user_metadata?.full_name) {
            return user.user_metadata.full_name.split(' ')[0];
        }

        if (user.email) {
            return user.email.split('@')[0];
        }

        return 'there';
    };

    return (
        <div className="space-y-4 py-4">
            <div className="mb-3 px-4 sm:px-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold">
                        {getTimeBasedGreeting()}, {getFirstName(user)}!
                    </h1>

                    {goalStreak > 0 && (
                        <p className="text-sm font-medium flex items-center bg-amber-100/10 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 px-3 py-1 rounded-full">
                            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                            {goalStreak} day streak!
                        </p>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {format(new Date(), 'EEEE, MMMM d')}
                </p>
            </div>

            <div className="block md:hidden space-y-4 px-4 sm:px-0">
                <OptimizedFocusTimeCard
                    isLoading={isLoading}
                    todayProgress={todayProgress}
                    isTimerActive={isTimerActive}
                    getTimerStatusText={getTimerStatusText}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    onStartFocusClick={() => setFocusDialogOpen(true)}
                    onResumeFocusClick={() => setShowFullScreenTimer(true)}
                    onEditGoal={() => setIsEditingFocusGoal(true)}
                    onSaveGoal={handleSaveFocusGoal}
                    isEditingFocusGoal={isEditingFocusGoal}
                    newFocusGoal={newFocusGoal}
                    setNewFocusGoal={setNewFocusGoal}
                    isMobile={true}
                />

                <OptimizedWellbeingCard
                    isLoading={isLoading}
                    wellnessScore={wellnessScore}
                    hasRecentMoodData={hasRecentMoodData}
                    getWellnessEmoji={getWellnessEmoji}
                    onTrackMoodClick={() => setMoodDialogOpen(true)}
                    onRelaxClick={() => router.push('/break')}
                    isMobile={true}
                />

                <div className="flex items-center justify-between bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center">
                        <ShieldBan className="h-5 w-5 mr-2 text-white" />
                        <div className="text-white">
                            <p className="font-medium text-sm">Distractions</p>
                            <p className="text-xs text-white/70">{blockedSitesCount} sites blocked</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setDistDialogOpen(true)}
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-none"
                        >
                            Manage
                        </Button>
                    </div>
                </div>
            </div>

            <div className="hidden md:grid md:grid-cols-3 gap-4 px-4 sm:px-0">
                <OptimizedFocusTimeCard
                    isLoading={isLoading}
                    todayProgress={todayProgress}
                    isTimerActive={isTimerActive}
                    getTimerStatusText={getTimerStatusText}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    onStartFocusClick={() => setFocusDialogOpen(true)}
                    onResumeFocusClick={() => setShowFullScreenTimer(true)}
                    onEditGoal={() => setIsEditingFocusGoal(true)}
                    onSaveGoal={handleSaveFocusGoal}
                    isEditingFocusGoal={isEditingFocusGoal}
                    newFocusGoal={newFocusGoal}
                    setNewFocusGoal={setNewFocusGoal}
                    isMobile={false}
                />

                <OptimizedDistractionsCard
                    isLoading={isLoading}
                    blockedSites={blockedSites}
                    siteStats={siteStats}
                    blockedSitesCount={blockedSitesCount}
                    onManageDistractionsClick={() => setDistDialogOpen(true)}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                />

                <OptimizedWellbeingCard
                    isLoading={isLoading}
                    wellnessScore={wellnessScore}
                    hasRecentMoodData={hasRecentMoodData}
                    getWellnessEmoji={getWellnessEmoji}
                    onTrackMoodClick={() => setMoodDialogOpen(true)}
                    onRelaxClick={() => router.push('/relax')}
                    isMobile={false}
                />
            </div>

            {focusDialogOpen && (
                <FocusSelector
                    onStart={handleStartFocus}
                    onClose={() => setFocusDialogOpen(false)}
                />
            )}

            <ManageDistractionsDialog
                user={user}
                isOpen={distDialogOpen}
                onOpenChange={setDistDialogOpen}
                blockedSitesCount={blockedSitesCount}
                onBlockedSitesUpdated={loadData}
            />

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