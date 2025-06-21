'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import 'react-circular-progressbar/dist/styles.css';
import { useUserGoals } from '@/hooks/use-user-goals';
import { useTimer } from '@/contexts/TimerProvider';
import { FocusSelector } from '@/components/timer/FocusSelector';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { Trophy } from 'lucide-react';
import { ManageDistractionsDialog } from './wellebing/ManageDistractionsDialog';
import { useRouter } from 'next/navigation';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { OptimizedFocusTimeCard } from './cards/OptimizedFocusTimeCard';
import { OptimizedDistractionsCard } from './cards/OptimizedDistractionsCard';
import { OptimizedWellbeingCard } from './cards/OptimizedWellbeingCard';

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
    const [focusDialogOpen, setFocusDialogOpen] = useState(false);
    const [distDialogOpen, setDistDialogOpen] = useState(false);
    const [distractionsKey, setDistractionsKey] = useState(0);

    const {
        initializeSession,
        timeRemaining,
        timeElapsed,
        isRunning,
        flowMode,
    } = useTimer();

    const { setShowFullScreenTimer } = useTimerUI();

    useEffect(() => {
        if (user) {
            calculateStreak();
        }
    }, [user, calculateStreak]);

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
        <div className="space-y-3 py-3">
            <div className="mb-2 px-4 sm:px-0">
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

            {/* Mobile View - New Layout */}
            <div className="block md:hidden space-y-3 px-4 sm:px-0">
                <OptimizedDistractionsCard
                    key={`mobile-${distractionsKey}`}
                    user={user}
                    onManageDistractionsClick={() => setDistDialogOpen(true)}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    isMobile={true}
                />
                <OptimizedWellbeingCard
                    user={user}
                    isMobile={true}
                />
                <OptimizedFocusTimeCard
                    user={user}
                    isTimerActive={isTimerActive}
                    getTimerStatusText={getTimerStatusText}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                    onStartFocusClick={() => setFocusDialogOpen(true)}
                    onResumeFocusClick={() => setShowFullScreenTimer(true)}
                    isMobile={true}
                />
            </div>

            {/* Desktop View - New Layout */}
            <div className="hidden md:grid md:grid-cols-2 gap-3 px-4 sm:px-0">
                <OptimizedDistractionsCard
                    key={`desktop-${distractionsKey}`}
                    user={user}
                    onManageDistractionsClick={() => setDistDialogOpen(true)}
                    formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                />
                <OptimizedWellbeingCard
                    user={user}
                    isMobile={false}
                />
                <div className="md:col-span-2">
                    <OptimizedFocusTimeCard
                        user={user}
                        isTimerActive={isTimerActive}
                        getTimerStatusText={getTimerStatusText}
                        formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                        onStartFocusClick={() => setFocusDialogOpen(true)}
                        onResumeFocusClick={() => setShowFullScreenTimer(true)}
                        isMobile={false}
                    />
                </div>
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
                onBlockedSitesUpdated={async () => setDistractionsKey(k => k + 1)} blockedSitesCount={0} />
        </div>
    );
};

export default DashboardComponet;