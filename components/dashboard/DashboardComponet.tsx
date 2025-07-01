'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import 'react-circular-progressbar/dist/styles.css';
import '@/components/notes/editor/realtime-editor.css';
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
import { NotesPageComponent } from '@/components/notes/NotesPageComponent';
import { ChevronDown } from 'lucide-react';

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
    const [mobileFocusSound, setMobileFocusSound] = useState('Atmosphere');
    const [showAtmosphereDropdown, setShowAtmosphereDropdown] = useState(false);
    const mobileVideoRef = useRef<HTMLVideoElement>(null);
    const atmosphereDropdownRef = useRef<HTMLDivElement>(null);
    const mobileWellbeingCardRef = useRef<HTMLDivElement>(null);
    const desktopWellbeingCardRef = useRef<HTMLDivElement>(null);

    // Atmosphere options for the dropdown
    const atmosphereOptions = [
        { value: 'Atmosphere', label: 'Atmosphere' },
        { value: 'Rain', label: 'Rain' },
        { value: 'Waves', label: 'Ocean Waves' },
        { value: 'Nature', label: 'Nature' },
        { value: 'Forest', label: 'Forest' },
        { value: 'Coffee', label: 'Coffee Shop' }
    ];

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
        endSession,
        updateSessionSound,
        sound: currentSound
    } = useTimer();

    const { setShowFullScreenTimer } = useTimerUI();

    // Video mapping for mobile header
    const videoMapping: { [key: string]: string } = {
        'Atmosphere': '/focus/none.mp4',
        'Rain': '/focus/rain.mp4',
        'Waves': '/focus/waves.mp4',
        'Nature': '/focus/forest.mp4',
        'Forest': '/focus/forest.mp4',
        'Coffee': '/focus/cafe.mp4'
    };

    // Sync mobile sound with timer context sound
    useEffect(() => {
        if (currentSound && currentSound !== 'none') {
            const displaySound = currentSound === 'atmosphere' ? 'Atmosphere' :
                currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
            setMobileFocusSound(displaySound);
        }
    }, [currentSound]);

    // Close atmosphere dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (atmosphereDropdownRef.current && !atmosphereDropdownRef.current.contains(event.target as Node)) {
                setShowAtmosphereDropdown(false);
            }
        };

        if (showAtmosphereDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showAtmosphereDropdown]);

    // Handle mobile video
    useEffect(() => {
        if (mobileVideoRef.current) {
            mobileVideoRef.current.muted = true;
            mobileVideoRef.current.loop = true;
            mobileVideoRef.current.playsInline = true;

            const playVideo = async () => {
                try {
                    await mobileVideoRef.current?.play();
                } catch (error) {
                    console.log('Video autoplay prevented:', error);
                }
            };

            playVideo();
        }
    }, [mobileFocusSound]);

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

    const handleMobileFocusStart = () => {
        const soundValue = mobileFocusSound === 'Atmosphere' ? 'atmosphere' : mobileFocusSound.toLowerCase();

        initializeSession({
            activity: 'focus',
            sound: soundValue,
            duration: 0,
            volume: 50,
            flowMode: true
        });
    };

    const handleMobileFocusEnd = () => {
        endSession();
    };

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAtmosphereChange = (newAtmosphere: string) => {
        setMobileFocusSound(newAtmosphere);
        setShowAtmosphereDropdown(false);

        // If a session is running, update the sound
        if (isRunning) {
            const soundValue = newAtmosphere === 'Atmosphere' ? 'atmosphere' : newAtmosphere.toLowerCase();
            updateSessionSound(soundValue);
        }
    };

    return (
        <div className="space-y-4 py-3">
            {/* Mobile Header Section with Focus Integration */}
            <div className="lg:hidden relative overflow-hidden rounded-b-3xl shadow-lg -mt-12 pt-16">
                {/* Video Background for Mobile */}
                <video
                    ref={mobileVideoRef}
                    className="absolute inset-0 w-full h-full object-cover rounded-b-3xl"
                    src={videoMapping[mobileFocusSound]}
                    autoPlay
                    muted
                    loop
                    playsInline
                />

                {/* Glass Overlay */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-b-3xl" />

                {/* Mobile Header Content */}
                <div className="relative z-10 px-6 pt-16 pb-8">
                    {/* Greeting and Date - Centered */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-medium text-white mb-1">
                            {getTimeBasedGreeting()}, {getFirstName(user)}
                        </h1>
                        <p className="text-sm text-white/80">
                            {format(new Date(), 'EEEE, MMMM d')}
                        </p>
                    </div>

                    {/* Focus Controls - Centered */}
                    <div className="flex flex-col items-center space-y-4">
                        {!isRunning ? (
                            /* Start Focus Button */
                            <button
                                onClick={handleMobileFocusStart}
                                className="mt-20 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium text-sm tracking-wide hover:bg-white/20 transition-all duration-200 shadow-lg"
                            >
                                Start Focus
                            </button>
                        ) : (
                            /* Running state - Timer and End button */
                            <>
                                <div className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                                    <div className="text-white/90 font-mono text-2xl font-medium tracking-wider text-center">
                                        {formatTime(timeElapsed || 0)}
                                    </div>
                                </div>
                                <button
                                    onClick={handleMobileFocusEnd}
                                    className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium text-sm tracking-wide hover:bg-white/20 transition-all duration-200 shadow-lg"
                                >
                                    Finish Session
                                </button>
                            </>
                        )}

                        {/* Atmosphere Dropdown - Centered under controls */}
                        <div className="relative" ref={atmosphereDropdownRef}>
                            <button
                                onClick={() => setShowAtmosphereDropdown(!showAtmosphereDropdown)}
                                className="flex items-center space-x-1 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-medium hover:bg-white/20 transition-all duration-200 shadow-lg"
                            >
                                <span>{mobileFocusSound}</span>
                                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAtmosphereDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showAtmosphereDropdown && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 max-h-[150px] overflow-y-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 hover:scrollbar-thumb-white/50">
                                    {atmosphereOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleAtmosphereChange(option.value)}
                                            className={`w-full px-3 py-2 text-left text-xs text-white hover:bg-white/20 transition-colors duration-150 ${mobileFocusSound === option.value ? 'bg-white/20' : ''
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Stats Section - Between video and content */}
            <div className="lg:hidden px-4 -mt-2 mb-4">
                <div className="header-gradient backdrop-blur-md border border-white/20 dark:border-white/10 rounded-3xl p-4 shadow-lg relative overflow-hidden">
                    {/* Glass overlay for enhanced glassmorphic effect */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-3xl"></div>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Title */}
                        <div className="text-center mb-3">
                            <h3 className="text-sm font-medium text-white/90">Today's Stats</h3>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center">
                            {/* Focus - Left */}
                            <div className="flex-1 text-center">
                                <div className="text-lg font-semibold text-white">
                                    {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayFocusTime)}
                                </div>
                                <div className="text-xs text-white/70">Focus</div>
                            </div>

                            {/* Separator */}
                            <div className="text-white/30 text-sm mx-2">|</div>

                            {/* Wellbeing - Center */}
                            <div className="flex-1 text-center">
                                {isLoadingSummary ? (
                                    <>
                                        <div className="text-lg font-semibold text-white">—</div>
                                        <div className="text-xs text-white/70">Wellbeing</div>
                                    </>
                                ) : todayWellbeingScore ? (
                                    <>
                                        <div className="text-lg font-semibold text-white">{todayWellbeingScore}</div>
                                        <div className="text-xs text-white/70">Wellbeing</div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={() => {
                                                // Try mobile first, then desktop
                                                const targetRef = mobileWellbeingCardRef.current || desktopWellbeingCardRef.current;
                                                if (targetRef) {
                                                    targetRef.scrollIntoView({
                                                        behavior: 'smooth',
                                                        block: 'center'
                                                    });
                                                }
                                            }}
                                            className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-medium hover:bg-white/20 transition-all duration-200"
                                        >
                                            Track
                                        </button>
                                        <div className="text-xs text-white/70 mt-1">Wellbeing</div>
                                    </div>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="text-white/30 text-sm mx-2">|</div>

                            {/* Distractions - Right */}
                            <div className="flex-1 text-center">
                                <div className="text-lg font-semibold text-white">
                                    {isLoadingSummary ? '—' : formatMinutesToHoursMinutes(todayDistractionTime)}
                                </div>
                                <div className="text-xs text-white/70">Distractions</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Header Section - Original Design */}
            <div className="mb-8 px-4 hidden lg:block">
                <div className="flex items-center justify-between">
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
            </div>            {/* Main Content Section */}
            <div className="px-4">
                {/* Mobile: Stacked vertically */}
                <div className="block lg:hidden space-y-4">
                    {/* Notes Section */}
                    <div className="h-[500px]">
                        <NotesPageComponent user={user} />
                    </div>

                    {/* Wellbeing only - Website block card removed on mobile */}
                    <div className="grid grid-cols-1 gap-4">
                        <div ref={mobileWellbeingCardRef}>
                            <OptimizedWellbeingCard
                                user={user}
                                isMobile={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop: All components in 2x2 grid layout */}
                <div className="hidden lg:block space-y-6">
                    {/* Top Row: Notes and Focus side by side */}
                    <div className="flex gap-6">
                        {/* Notes Section */}
                        <div className="flex-1 h-[400px]">
                            <NotesPageComponent user={user} />
                        </div>

                        {/* Focus Card */}
                        <div className="w-80 flex-shrink-0">
                            <OptimizedFocusTimeCard
                                user={user}
                                isMobile={false}
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Wellbeing and Distractions side by side */}
                    <div className="flex gap-6">
                        {/* Wellbeing Card - 50% width */}
                        <div className="flex-1" ref={desktopWellbeingCardRef}>
                            <OptimizedWellbeingCard
                                user={user}
                                isMobile={false}
                            />
                        </div>

                        {/* Distractions Card - 50% width */}
                        <div className="flex-1">
                            <OptimizedDistractionsCard
                                key={`desktop-${distractionsKey}`}
                                user={user}
                                onManageDistractionsClick={() => setDistDialogOpen(true)}
                                formatMinutesToHoursMinutes={formatMinutesToHoursMinutes}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ManageDistractionsDialog
                user={user}
                isOpen={distDialogOpen}
                onOpenChange={setDistDialogOpen}
                onBlockedSitesUpdated={async () => setDistractionsKey(k => k + 1)} blockedSitesCount={0} />
        </div >
    );
};

export default DashboardComponet;