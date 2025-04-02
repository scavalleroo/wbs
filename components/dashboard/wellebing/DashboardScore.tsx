import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBlockedSite } from "@/hooks/use-blocked-site";
import useMood from "@/hooks/use-mood";
import { User } from "@supabase/supabase-js";
import {
    Clock, Download, FileEdit, Heart,
    ShieldAlert, Timer, Flame, ArrowUpCircle, PencilLine, ShieldBan,
    Coffee
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFocusSession } from "@/hooks/use-focus-session";
import { FocusSelector } from "@/components/timer/FocusSelector";
import { Dialog } from "@/components/ui/dialog";
import { useTimer } from "@/contexts/TimerProvider";
import { ManageDistractionsDialog } from "./ManageDistractionsDialog";
import { cn } from "@/lib/utils";
import MoodTrackingModal from "@/components/moodTracking/MoodTrackingModal";

export const DashboardScore = ({ user, setTimeRange, timeRange }: {
    user: User | null | undefined;
    setTimeRange: ((value: string) => void) | undefined,
    timeRange: 'week' | 'month' | 'year'
}) => {
    const router = useRouter();
    const { initializeSession } = useTimer();
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

    return (
        <TooltipProvider>
            <div className="flex flex-col px-3 py-4 md:w-80 w-full items-center bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md gap-3 dark:from-indigo-950 dark:to-purple-950 overflow-hidden">
                {/* Title with streak - fixed spacing */}
                <div className="flex items-center justify-between w-full text-white gap-2">
                    <h2 className="text-lg font-bold truncate">Dashbaord</h2>
                    {streakCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center bg-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                    <Flame className="h-3.5 w-3.5 text-amber-400 mr-1" />
                                    <span className="text-xs font-medium text-amber-300">{streakCount}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{streakCount} day streak of wellness tracking!</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Metrics section - changed to 2 columns */}
                <div className="grid grid-cols-2 gap-2 w-full mb-1">
                    {/* Focus time today */}
                    <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-center mb-1">
                            <Clock className="h-3.5 w-3.5 text-blue-200 mr-1.5" />
                            <p className="text-[10px] text-white/70">Focus Time</p>
                        </div>
                        <p className="text-white text-sm font-semibold flex items-center">
                            {isLoading ? '...' : formatDuration(focusTimeToday)}
                            {focusTimeToday > 7200 && <ArrowUpCircle className="h-3 w-3 text-green-400 ml-1" />}
                        </p>
                        <p className="text-[10px] text-white/50 truncate">
                            {sessionCountToday} {sessionCountToday === 1 ? 'session' : 'sessions'}
                        </p>
                    </div>

                    {/* Wellbeing score */}
                    <div
                        className={cn(
                            "bg-white/10 backdrop-blur-sm p-2 rounded-lg transition-all duration-200",
                            !hasRecentMoodData && "bg-amber-500/20 hover:bg-amber-500/30",
                            hasRecentMoodData && "hover:bg-white/15"
                        )}
                        onClick={() => !hasRecentMoodData && setMoodDialogOpen(true)}
                        role={!hasRecentMoodData ? "button" : undefined}
                    >
                        <div className="flex items-center mb-1">
                            <Heart className="h-3.5 w-3.5 text-pink-200 mr-1.5" />
                            <p className="text-[10px] text-white/70">Wellness</p>
                        </div>
                        <p className="text-white text-sm font-semibold flex items-center">
                            {isLoading ? '...' : (
                                wellnessScore !== null ?
                                    <>
                                        {wellnessScore}/100
                                        <span className="ml-1">{getWellnessEmoji(wellnessScore)}</span>
                                    </> :
                                    'Record now'
                            )}
                        </p>
                    </div>

                    {/* Blocked site attempts - moved to full width */}
                    <div className="col-span-2 bg-white/10 backdrop-blur-sm p-2 rounded-lg hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <ShieldAlert className="h-3.5 w-3.5 text-emerald-200 mr-1.5" />
                                <p className="text-[10px] text-white/70">Distractions Blocked</p>
                            </div>
                            <p className="text-white text-sm font-semibold">
                                {isLoading ? '...' : (
                                    blockedStats.attempts > 0 ?
                                        `${blockedStats.attempts - blockedStats.bypasses}/${blockedStats.attempts}` :
                                        '0'
                                )}
                            </p>
                        </div>
                        {blockedStats.bypasses > 0 && (
                            <p className="text-[10px] text-white/50 text-right">
                                {blockedStats.bypasses} bypassed
                            </p>
                        )}
                    </div>
                </div>

                {/* Track wellness button if no recent data */}
                {!hasRecentMoodData && (
                    <Button
                        variant="outline"
                        onClick={() => setMoodDialogOpen(true)}
                        className="w-full bg-amber-500/20 border-amber-400/30 text-white hover:bg-amber-500/30 hover:border-amber-400/50 text-xs py-1 h-auto"
                    >
                        <PencilLine className="mr-1 h-3 w-3" />
                        Record today's wellness
                    </Button>
                )}

                {/* Extension download for desktop only - simplified */}
                {isDesktop && (
                    <Button
                        variant="outline"
                        onClick={() => extensionUrl && window.open(extensionUrl, '_blank')}
                        className="w-full bg-blue-500/20 border-blue-400/30 text-white hover:bg-blue-500/30 hover:border-blue-400/50 text-xs py-1 h-auto"
                    >
                        <Download className="mr-1 h-3 w-3" />
                        <div className="flex flex-col items-start">
                            <span className="truncate">Get Chrome Extension</span>
                            <span className="text-[10px] text-white/70">Block distracting websites</span>
                        </div>
                    </Button>
                )}

                {/* Four action buttons - responsive layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-2 w-full">
                    {/* Set intention button */}
                    <Button
                        variant="outline"
                        onClick={() => router.push('/notes')}
                        className="h-40 sm:h-32 md:h-auto bg-[url('/images/intention-bg.jpg')] bg-cover bg-center md:bg-gradient-to-r md:from-blue-600/40 md:to-indigo-600/40 border-white/20 text-white md:hover:bg-gradient-to-r md:hover:from-blue-600/30 md:hover:to-indigo-600/30 md:hover:border-white/30 p-2 md:py-3 md:px-4 justify-end md:justify-start text-xs overflow-hidden relative"
                    >
                        <div className="z-10 flex items-center justify-center w-full absolute bottom-2 left-0 md:static md:justify-start">
                            <div className="hidden md:flex bg-white/20 rounded-full p-2 mr-3">
                                <FileEdit className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-center md:text-left text-white text-shadow-sm">Intention</span>
                        </div>
                    </Button>

                    {/* Start focus session button */}
                    <Button
                        variant="outline"
                        onClick={() => setFocusDialogOpen(true)}
                        className="h-40 sm:h-32 md:h-auto bg-[url('/images/focus-bg.jpg')] bg-cover bg-center md:bg-gradient-to-r md:from-indigo-600/40 md:to-purple-600/40 border-white/20 text-white md:hover:bg-gradient-to-r md:hover:from-indigo-600/30 md:hover:to-purple-600/30 md:hover:border-white/30 p-2 md:py-3 md:px-4 justify-end md:justify-start text-xs overflow-hidden relative"
                    >
                        <div className="z-10 flex items-center justify-center w-full absolute bottom-2 left-0 md:static md:justify-start">
                            <div className="hidden md:flex bg-white/20 rounded-full p-2 mr-3">
                                <Timer className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-center md:text-left text-white text-shadow-sm">Focus</span>
                        </div>
                    </Button>

                    {/* Relax/Break button */}
                    <Button
                        variant="outline"
                        onClick={() => router.push('/break')}
                        className="h-40 sm:h-32 md:h-auto bg-[url('/images/relax-bg.jpg')] bg-cover bg-center md:bg-gradient-to-r md:from-teal-600/40 md:to-blue-600/40 border-white/20 text-white md:hover:bg-gradient-to-r md:hover:from-teal-600/30 md:hover:to-blue-600/30 md:hover:border-white/30 p-2 md:py-3 md:px-4 justify-end md:justify-start text-xs overflow-hidden relative"
                    >
                        <div className="z-10 flex items-center justify-center w-full absolute bottom-2 left-0 md:static md:justify-start">
                            <div className="hidden md:flex bg-white/20 rounded-full p-2 mr-3">
                                <Coffee className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-center md:text-left text-white text-shadow-sm">Relax</span>
                        </div>
                    </Button>

                    {/* Manage distractions button */}
                    <Button
                        variant="outline"
                        onClick={() => setDistDialogOpen(true)}
                        className="h-40 sm:h-32 md:h-auto bg-[url('/images/distractions-bg.jpg')] bg-cover bg-center md:bg-gradient-to-r md:from-purple-600/40 md:to-pink-600/40 border-white/20 text-white md:hover:bg-gradient-to-r md:hover:from-purple-600/30 md:hover:to-pink-600/30 md:hover:border-white/30 p-2 md:py-3 md:px-4 justify-end md:justify-start text-xs overflow-hidden relative"
                    >
                        <div className="z-10 flex items-center justify-center w-full absolute bottom-2 left-0 md:static md:justify-start">
                            <div className="hidden md:flex bg-white/20 rounded-full p-2 mr-3">
                                <ShieldBan className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-center md:text-left text-white text-shadow-sm">Block</span>
                        </div>
                    </Button>
                </div>

                {/* Leave the dialogs unchanged */}
                <Dialog open={focusDialogOpen} onOpenChange={setFocusDialogOpen}>
                    <FocusSelector onStart={handleStartFocus} />
                </Dialog>

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