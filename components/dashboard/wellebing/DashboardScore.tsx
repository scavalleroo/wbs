import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBlockedSite } from "@/hooks/use-blocked-site";
import useMood from "@/hooks/use-mood";
import { User } from "@supabase/supabase-js";
import {
    Download, FileEdit, Timer, ShieldBan,
    Coffee
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFocusSession } from "@/hooks/use-focus-session";
import { FocusSelector } from "@/components/timer/FocusSelector";
import { Dialog } from "@/components/ui/dialog";
import { useTimer } from "@/contexts/TimerProvider";
import { ManageDistractionsDialog } from "./ManageDistractionsDialog";
import MoodTrackingModal from "@/components/moodTracking/MoodTrackingModal";
import { useTimerUI } from "@/contexts/TimerUIProvider";

export const DashboardScore = ({ user, setTimeRange, timeRange }: {
    user: User | null | undefined;
    setTimeRange: ((value: string) => void) | undefined,
    timeRange: 'week' | 'month' | 'year'
}) => {
    const router = useRouter();
    const {
        initializeSession,
        timeRemaining,
        timeElapsed,
        sound,
        isRunning,
        flowMode
    } = useTimer();
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [focusScore, setFocusScore] = useState<number | null>(null);
    const [focusTimeToday, setFocusTimeToday] = useState<number>(0);
    const [sessionCountToday, setSessionCountToday] = useState<number>(0);
    const [streakCount, setStreakCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [focusDialogOpen, setFocusDialogOpen] = useState(false);
    const [distDialogOpen, setDistDialogOpen] = useState(false);
    const [moodDialogOpen, setMoodDialogOpen] = useState(false);
    const [blockedStats, setBlockedStats] = useState({
        attempts: 0,
        bypasses: 0
    });
    const [blockedSitesCount, setBlockedSitesCount] = useState(0);
    const [hasRecentMoodData, setHasRecentMoodData] = useState(true);
    const [isDesktop, setIsDesktop] = useState(false);

    const { getMoodHistory } = useMood({ user });
    const { getFocusData, getBlockedSiteStats, getBlockedSitesCount } = useBlockedSite({ user });
    const { recentSessions, fetchRecentSessions } = useFocusSession({ user });
    const [extensionUrl, setExtensionUrl] = useState("");

    // Add this to get access to showing the full screen timer:
    const { setShowFullScreenTimer } = useTimerUI();

    // Add this effect to safely set the URL client-side only
    useEffect(() => {
        // Only set the URL after component mounts (client-side)
        if (typeof window !== 'undefined') {
            setExtensionUrl(`https://chrome.google.com/webstore/detail/${process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || process.env.CHROME_EXTENSION_ID}`);
        }
    }, []);

    // Check if it's desktop on mount
    useEffect(() => {
        setIsDesktop(window.innerWidth >= 768);
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get wellness emoji based on score
    const getWellnessEmoji = (score: number | null) => {
        if (score === null) return '📝';
        if (score >= 90) return '🌟';
        if (score >= 75) return '😊';
        if (score >= 60) return '😌';
        if (score >= 45) return '😐';
        if (score >= 30) return '😕';
        return '😔';
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

    // Load all data
    const loadData = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Load wellness score
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 30); // Look back 30 days
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

                // Calculate streak
                let streak = 0;
                const dates = new Set();
                sortedHistory.forEach(entry => {
                    const date = new Date(entry.tracked_date);
                    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    dates.add(dateStr);
                });

                // Check if each day in the past has an entry
                for (let i = 0; i < 30; i++) {
                    const checkDate = new Date();
                    checkDate.setDate(checkDate.getDate() - i);
                    const checkDateStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

                    if (dates.has(checkDateStr)) {
                        streak++;
                    } else if (i > 0) { // Allow today to be missing
                        break;
                    }
                }
                setStreakCount(streak);

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

            // Load focus score
            const { currentScore } = await getFocusData(timeRange);
            setFocusScore(currentScore);

            // Load blocked site stats
            const stats = await getBlockedSiteStats();
            const todaysStats = stats.reduce<{ attempts: number; bypasses: number }>(
                (acc, site: any) => {
                    return {
                        attempts: acc.attempts + (site.todayCount || 0),
                        bypasses: acc.bypasses + (site.todayBypasses || 0)
                    };
                },
                { attempts: 0, bypasses: 0 }
            );
            setBlockedStats(todaysStats);

            // Get blocked sites count
            const count = await getBlockedSitesCount();
            setBlockedSitesCount(count);

            // Load focus session data for today
            await fetchRecentSessions(50); // Fetch recent sessions
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate today's focus time once sessions are loaded
    useEffect(() => {
        if (recentSessions.length > 0) {
            const today = new Date();
            const todaySessions = recentSessions.filter(session => {
                const sessionDate = new Date(session.created_at);
                return sessionDate.getDate() === today.getDate() &&
                    sessionDate.getMonth() === today.getMonth() &&
                    sessionDate.getFullYear() === today.getFullYear() &&
                    session.actual_duration >= 60; // Only count sessions longer than a minute
            });

            const totalTime = todaySessions.reduce((sum, session) => sum + session.actual_duration, 0);
            setFocusTimeToday(totalTime);
            setSessionCountToday(todaySessions.length);
        }
    }, [recentSessions]);

    // Load data on initial render
    useEffect(() => {
        loadData();
    }, [user]);

    // Handle focus session start
    const handleStartFocus = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        // Use initializeSession instead of individual setters
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration, // Note: initializeSession handles conversion to seconds
            volume: settings.volume,
            flowMode: settings.flowMode
        });

        setFocusDialogOpen(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getFirstName = (user: User | null | undefined) => {
        if (!user) return 'Friend';

        // Try to get the full name from user metadata
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
            // Split by space and take just the first part (first name)
            return fullName.split(' ')[0];
        }

        // If no full name, try to use the email
        if (user.email) {
            return user.email.split('@')[0];
        }

        // Fallback
        return 'Friend';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col px-3 py-4 md:w-80 w-full items-center bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md gap-3 dark:from-indigo-950 dark:to-purple-950 overflow-hidden">
                {/* Title with streak - fixed spacing */}
                <div className="flex items-center justify-between w-full text-white gap-2">
                    <h2 className="text-lg font-bold flex flex-wrap items-center">
                        <span className="mr-1">{getGreeting()},</span>
                        <span className="truncate max-w-[120px] sm:max-w-full">
                            {getFirstName(user)}
                        </span>
                    </h2>
                </div>

                {/* Four action buttons - with text positioned on the right side */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-2 w-full">
                    {/* Set intention button */}
                    <Button
                        variant="outline"
                        onClick={() => router.push('/notes')}
                        className="relative h-40 sm:h-32 md:h-auto bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white hover:from-blue-600 hover:to-indigo-700 p-3 md:p-4 text-start text-xs overflow-hidden"
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-white/10 -mr-12 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 -mr-8 z-0"></div>

                        {/* Semi-transparent overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/30 z-0"></div>

                        <div className="z-10 flex flex-col h-full text-left w-full">
                            <div className="flex items-center justify-start gap-1.5 mb-1.5">
                                <div className="flex bg-white/20 rounded-full p-1.5">
                                    <FileEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <span className="font-bold text-base sm:text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Intention</span>
                            </div>
                            <p className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-left">Set your daily goals</p>
                        </div>
                    </Button>

                    {/* Start focus session button */}
                    <Button
                        variant="outline"
                        onClick={() => {
                            // Check if timer is active - FIXED LOGIC
                            if ((flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning)) {
                                // If there's already an active session, just show it
                                setShowFullScreenTimer(true);
                            } else {
                                // Otherwise open the dialog to start a new session
                                setFocusDialogOpen(true);
                            }
                        }}
                        className="relative h-40 sm:h-32 md:h-auto bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white hover:from-indigo-600 hover:to-purple-700 p-3 md:p-4 text-start text-xs overflow-hidden"
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-white/10 -mr-12 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 -mr-8 z-0"></div>

                        {/* Semi-transparent overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/30 z-0"></div>

                        <div className="z-10 flex flex-col h-full text-left w-full">
                            <div className="flex items-center justify-start gap-1.5 mb-1.5">
                                <div className="flex bg-white/20 rounded-full p-1.5">
                                    <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <span className="font-bold text-base sm:text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                    {(flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning)
                                        ? "Resume Focus"
                                        : "Focus"
                                    }
                                </span>
                            </div>
                            <p className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-left">
                                {(flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning)
                                    ? `${flowMode ? "In progress" : formatTime(timeRemaining) + " left"}`
                                    : "Start a focus session"
                                }
                            </p>
                        </div>
                    </Button>

                    {/* Relax/Break button */}
                    <Button
                        variant="outline"
                        onClick={() => router.push('/break')}
                        className="relative h-40 sm:h-32 md:h-auto bg-gradient-to-r from-teal-500 to-blue-600 border-none text-white hover:from-teal-600 hover:to-blue-700 p-3 md:p-4 text-start text-xs overflow-hidden"
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-white/10 -mr-12 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 -mr-8 z-0"></div>

                        {/* Semi-transparent overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/30 z-0"></div>

                        <div className="z-10 flex flex-col h-full text-left w-full">
                            <div className="flex items-center justify-start gap-1.5 mb-1.5">
                                <div className="flex bg-white/20 rounded-full p-1.5">
                                    <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <span className="font-bold text-base sm:text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Relax</span>
                            </div>
                            <p className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-left">Take a guided break</p>
                        </div>
                    </Button>

                    {/* Manage distractions button */}
                    <Button
                        variant="outline"
                        onClick={() => setDistDialogOpen(true)}
                        className="relative h-40 sm:h-32 md:h-auto bg-gradient-to-r from-purple-500 to-pink-600 border-none text-white hover:from-purple-600 hover:to-pink-700 p-3 md:p-4 text-start text-xs overflow-hidden"
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-white/10 -mr-12 z-0"></div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 -mr-8 z-0"></div>

                        {/* Semi-transparent overlay for better text contrast */}
                        <div className="absolute inset-0 bg-black/30 z-0"></div>

                        <div className="z-10 flex flex-col h-full text-left w-full">
                            <div className="flex items-center justify-start gap-1.5 mb-1.5">
                                <div className="flex bg-white/20 rounded-full p-1.5">
                                    <ShieldBan className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <span className="font-bold text-base sm:text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Block</span>
                            </div>
                            <p className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-left">Manage distractions</p>
                        </div>
                    </Button>
                </div>

                {/* Extension download for desktop only - improved styling */}
                {isDesktop && (
                    <>
                        {/* Separator before extension button */}
                        <div className="w-full h-px bg-white/20 my-2"></div>
                        <Button
                            variant="outline"
                            onClick={() => extensionUrl && window.open(extensionUrl, '_blank')}
                            className="relative w-full md:h-auto bg-gradient-to-r from-blue-500/80 to-blue-600/80 border-none text-white hover:from-blue-600/90 hover:to-blue-700/90 p-3 md:p-4 text-start text-xs overflow-hidden"
                        >
                            {/* Decorative circles */}
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 -mr-16 z-0"></div>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 rounded-full bg-white/10 -mr-12 z-0"></div>
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 -mr-8 z-0"></div>

                            {/* Semi-transparent overlay for better text contrast */}
                            <div className="absolute inset-0 bg-black/30 z-0"></div>

                            <div className="z-10 flex flex-col h-full text-left w-full">
                                <div className="flex items-center justify-start gap-1.5 mb-1.5">
                                    <div className="flex bg-white/20 rounded-full p-1.5">
                                        <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <span className="font-bold text-base sm:text-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Chrome Extension</span>
                                </div>
                                <p className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] text-left">Block distracting websites</p>
                            </div>
                        </Button>
                    </>
                )}

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
        </TooltipProvider>
    );
};