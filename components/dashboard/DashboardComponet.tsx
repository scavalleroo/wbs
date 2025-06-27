'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import 'react-circular-progressbar/dist/styles.css';
import { useUserGoals } from '@/hooks/use-user-goals';
import { useFocusSession } from '@/hooks/use-focus-session';
import { useTimer } from '@/contexts/TimerProvider';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { ManageDistractionsDialog } from './wellebing/ManageDistractionsDialog';
import { useRouter } from 'next/navigation';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { OptimizedFocusTimeCard } from './cards/OptimizedFocusTimeCard';
import { OptimizedDistractionsCard } from './cards/OptimizedDistractionsCard';
import { OptimizedWellbeingCard } from './cards/OptimizedWellbeingCard';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import useMood from '@/hooks/use-mood';

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
    const router = useRouter();
    const { goalStreak, calculateStreak } = useUserGoals({ user });
    const { getTodaysFocusTime } = useFocusSession({ user });
    const { getBlockedSiteStats } = useBlockedSite({ user });
    const { fetchMood } = useMood({ user });
    const [distDialogOpen, setDistDialogOpen] = useState(false);
    const [distractionsKey, setDistractionsKey] = useState(0);

    // Dashboard summary data
    const [todayFocusTime, setTodayFocusTime] = useState(0);
    const [todayWellbeingScore, setTodayWellbeingScore] = useState<number | null>(null);
    const [todayDistractionTime, setTodayDistractionTime] = useState(0);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);

    const {
        initializeSession,
        timeRemaining,
        timeElapsed,
        isRunning,
        flowMode,
        sessionId,
    } = useTimer();

    const { setShowFullScreenTimer } = useTimerUI();

    useEffect(() => {
        if (user) {
            calculateStreak();
            loadDashboardSummary();
        }
    }, [user, calculateStreak]);

    // Only refresh summary when a session ends (not during active timer)
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // If we had a session that's now gone, refresh the data
            if (lastSessionId && !sessionId) {
                loadDashboardSummary();
            }
            setLastSessionId(sessionId);
        }
    }, [user, sessionId, lastSessionId]);

    const loadDashboardSummary = async () => {
        if (!user) return;

        setIsLoadingSummary(true);
        try {
            // Load focus time directly from focus sessions
            const todayFocusSeconds = await getTodaysFocusTime();
            setTodayFocusTime(Math.round(todayFocusSeconds / 60)); // Convert to minutes

            // Load wellbeing score
            const moodData = await fetchMood();
            if (moodData) {
                // Calculate daily wellness score
                const values = [
                    moodData.mood_rating,
                    moodData.sleep_rating,
                    moodData.nutrition_rating,
                    moodData.exercise_rating,
                    moodData.social_rating
                ].filter(v => typeof v === 'number');

                if (values.length > 0) {
                    const pointsPerMetric = 100 / values.length;
                    let calculatedScore = 0;
                    if (typeof moodData.mood_rating === 'number') calculatedScore += (moodData.mood_rating / 5) * pointsPerMetric;
                    if (typeof moodData.sleep_rating === 'number') calculatedScore += (moodData.sleep_rating / 5) * pointsPerMetric;
                    if (typeof moodData.nutrition_rating === 'number') calculatedScore += (moodData.nutrition_rating / 5) * pointsPerMetric;
                    if (typeof moodData.exercise_rating === 'number') calculatedScore += (moodData.exercise_rating / 5) * pointsPerMetric;
                    if (typeof moodData.social_rating === 'number') calculatedScore += (moodData.social_rating / 5) * pointsPerMetric;
                    setTodayWellbeingScore(Math.round(calculatedScore));
                }
            }

            // Load distraction time
            const siteStats = await getBlockedSiteStats();
            if (siteStats && Array.isArray(siteStats)) {
                const totalDistractionSeconds = siteStats.reduce((total: number, site: any) => {
                    return total + (site.todayTimeSeconds || 0);
                }, 0);
                setTodayDistractionTime(Math.round(totalDistractionSeconds / 60)); // Convert to minutes
            }

        } catch (error) {
            console.error('Error loading dashboard summary:', error);
        } finally {
            setIsLoadingSummary(false);
        }
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
        <div className="space-y-4 py-3">
            {/* Header Section with improved visual hierarchy */}
            <div className="mb-8 px-4 sm:px-0">
                {/* Mobile: Stacked vertically */}
                <div className="flex flex-col gap-4 lg:hidden">
                    <div>
                        <h1 className="text-2xl font-medium text-foreground">
                            {getTimeBasedGreeting()}, {getFirstName(user)}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {format(new Date(), 'EEEE, MMMM d')}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayFocusTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">Focus</div>
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : (todayWellbeingScore ? `${todayWellbeingScore}` : '—')}
                            </div>
                            <div className="text-xs text-muted-foreground">Wellbeing</div>
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayDistractionTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">Distractions</div>
                        </div>
                    </div>
                </div>

                {/* Desktop: Horizontal layout */}
                <div className="hidden lg:flex lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-medium text-foreground">
                            {getTimeBasedGreeting()}, {getFirstName(user)}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {format(new Date(), 'EEEE, MMMM d')}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayFocusTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">Focus</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : (todayWellbeingScore ? `${todayWellbeingScore}` : '—')}
                            </div>
                            <div className="text-xs text-muted-foreground">Wellbeing</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-medium text-foreground">
                                {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayDistractionTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">Distractions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View - Improved Layout */}
            <div className="block lg:hidden space-y-4 px-4 sm:px-0">
                {/* Focus Card - Most Important, Goes First */}
                <OptimizedFocusTimeCard
                    user={user}
                    isMobile={true}
                />

                {/* Side by side for secondary features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OptimizedWellbeingCard
                        user={user}
                        isMobile={true}
                    />
                    <OptimizedDistractionsCard
                        key={`mobile-${distractionsKey}`}
                        user={user}
                        onManageDistractionsClick={() => setDistDialogOpen(true)}
                        formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                        isMobile={true}
                    />
                </div>
            </div>

            {/* Desktop View - Improved Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4 px-4 sm:px-0">
                {/* Focus takes full width to emphasize its importance */}
                <div className="lg:col-span-3">
                    <OptimizedFocusTimeCard
                        user={user}
                        isMobile={false}
                    />
                </div>

                {/* Wellbeing takes 2 columns for chart visibility */}
                <div className="lg:col-span-2">
                    <OptimizedWellbeingCard
                        user={user}
                        isMobile={false}
                    />
                </div>

                {/* Distractions in remaining column */}
                <OptimizedDistractionsCard
                    key={`desktop-${distractionsKey}`}
                    user={user}
                    onManageDistractionsClick={() => setDistDialogOpen(true)}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                />
            </div>

            <ManageDistractionsDialog
                user={user}
                isOpen={distDialogOpen}
                onOpenChange={setDistDialogOpen}
                onBlockedSitesUpdated={async () => setDistractionsKey(k => k + 1)} blockedSitesCount={0} />
        </div>
    );
};

export default DashboardComponet;