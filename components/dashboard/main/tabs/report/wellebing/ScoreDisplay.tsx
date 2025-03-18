import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBlockedSite } from "@/hooks/use-blocked-site";
import useMood from "@/hooks/use-mood";
import { User } from "@supabase/supabase-js";
import { Brain, Download, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import MoodTrackingModal from "../../../moodTracking/MoodTrackingModal";

export const ScoreDisplay = ({ user, setTimeRange, timeRange }: { user: User | null | undefined; setTimeRange: ((value: string) => void) | undefined, timeRange: 'week' | 'month' | 'year' }) => {
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [focusScore, setFocusScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { getMoodHistory } = useMood({ user });
    const { getFocusData } = useBlockedSite({ user });

    // Add this helper function to format date labels
    const getFormattedDateLabel = (date: Date): string => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    // Extract the loadScores function so we can call it after modal completion
    const loadScores = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Get wellness score
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 30); // Look back 30 days

            const moodHistory = await getMoodHistory(startDate.toISOString(), today.toISOString());

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
            }

            // Get focus score
            const { currentScore } = await getFocusData(timeRange);
            setFocusScore(currentScore);
        } catch (error) {
            console.error("Error loading scores:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadScores();
    }, [user, timeRange, getMoodHistory, getFocusData]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-4 bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md">
                <div className="animate-pulse rounded-full bg-white/20 h-24 w-24"></div>
            </div>
        );
    }

    // Calculate combined score
    const combinedScore = (wellnessScore !== null && focusScore !== null)
        ? Math.round((wellnessScore + focusScore) / 2)
        : null;

    // Optimized colors for better contrast and accessibility
    const colors = {
        focus: {
            ring: "#4ADE80", // emerald-400
            background: "rgba(16, 185, 129, 0.2)" // emerald-600 with transparency
        },
        wellness: {
            ring: "#38BDF8", // sky-400
            background: "rgba(14, 165, 233, 0.2)" // sky-500 with transparency
        },
        combined: {
            ring: "#E879F9", // fuchsia-400
            background: "rgba(217, 70, 239, 0.2)" // fuchsia-600 with transparency
        }
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col px-4 py-4 md:py-6 items-center bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md gap-6 dark:from-indigo-950 dark:to-purple-950 w-full md:w-auto md:max-w-mdoverflow-hidden flex-col md:items-center md:justify-between">
                {/* <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                    <TabsList className="bg-neutral-900/30 dark:bg-neutral-50/30">
                        <TabsTrigger
                            value="week"
                            className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white"
                        >
                            Week
                        </TabsTrigger>
                        <TabsTrigger
                            value="month"
                            className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white"
                        >
                            Month
                        </TabsTrigger>
                        <TabsTrigger
                            value="year"
                            className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white"
                        >
                            Year
                        </TabsTrigger>
                    </TabsList>
                </Tabs> */}
                {/* Title with Weko logo */}
                <div className="flex items-center md:justify-center -mt-4 w-full">
                    <img
                        src="/logoTransparent.svg"
                        alt="Weko"
                        className="h-16 -mt-1 mr-1 w-auto"
                    />
                    <span className="text-white text-lg font-medium">dashboard</span>
                </div>

                <div className="flex flex-col items-center gap-2 -mt-8">
                    <p className="text-xs text-white text-opacity-90">Today's score</p>

                    <div className="flex flex-row md:flex-col items-center gap-2">

                        {/* Circle Progress Display */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 mx-auto">
                            <svg viewBox="0 0 100 100" width="100%" height="100%">
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke={colors.combined.background}
                                    strokeWidth="7"
                                />

                                <circle
                                    cx="50" cy="50" r="36"
                                    fill="none"
                                    stroke={colors.wellness.background}
                                    strokeWidth="7"
                                />
                                <circle
                                    cx="50" cy="50" r="27"
                                    fill="none"
                                    stroke={colors.focus.background}
                                    strokeWidth="7"
                                />

                                {/* Progress circles - bright, high-contrast colors */}
                                {combinedScore !== null && (
                                    <circle
                                        cx="50" cy="50" r="45"
                                        fill="none"
                                        stroke={colors.combined.ring}
                                        strokeWidth="7"
                                        strokeDasharray={`${2 * Math.PI * 45 * (combinedScore / 100)} ${2 * Math.PI * 45}`}
                                        transform="rotate(-90 50 50)"
                                        strokeLinecap="round"
                                    />
                                )}

                                {wellnessScore !== null && (
                                    <circle
                                        cx="50" cy="50" r="36"
                                        fill="none"
                                        stroke={colors.wellness.ring}
                                        strokeWidth="7"
                                        strokeDasharray={`${2 * Math.PI * 36 * (wellnessScore / 100)} ${2 * Math.PI * 36}`}
                                        transform="rotate(-90 50 50)"
                                        strokeLinecap="round"
                                    />
                                )}

                                {focusScore !== null && (
                                    <circle
                                        cx="50" cy="50" r="27"
                                        fill="none"
                                        stroke={colors.focus.ring}
                                        strokeWidth="7"
                                        strokeDasharray={`${2 * Math.PI * 27 * (focusScore / 100)} ${2 * Math.PI * 27}`}
                                        transform="rotate(-90 50 50)"
                                        strokeLinecap="round"
                                    />
                                )}

                                <circle
                                    cx="50" cy="50" r="19"
                                    fill="rgba(255,255,255,0.25)"
                                    className="dark:fill-purple-900/40"
                                />

                                <text
                                    x="50"
                                    y="50"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="16"
                                    className="text-[16px] sm:text-[20px] md:text-[22px] font-semibold fill-white select-none"
                                >
                                    {combinedScore !== null ? combinedScore : '–'}
                                </text>
                            </svg>
                        </div>

                        {/* Score Stats - Enhanced contrast for accessibility */}
                        <div className="flex flex-row gap-4 md:flex-row md:justify-center w-full">
                            {/* Focus Stats */}
                            <div className="bg-white/20 rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col items-center backdrop-blur-sm w-full md:flex-1 md:max-w-[140px]">
                                <p className="text-xs text-white text-opacity-90">Focus score</p>
                                {focusScore !== null ? (
                                    <div className="flex flex-row items-center gap-1.5">
                                        <div className="bg-white/30 p-1 rounded-full" style={{ backgroundColor: colors.focus.background }}>
                                            <Brain className="size-3 text-white" style={{ color: colors.focus.ring }} />
                                        </div>
                                        <span className="text-lg font-medium text-white">{focusScore}</span>
                                    </div>
                                ) : (
                                    <Button
                                        className="mt-1 bg-white/30 hover:bg-white/40 text-white text-xs font-medium py-1 px-2 rounded-md flex items-center gap-1 transition-colors"
                                        onClick={() => window.open('/extension', '_blank')}
                                    >
                                        <div className="bg-white/30 p-1 rounded-full" style={{ backgroundColor: colors.focus.background }}>
                                            <Download className="size-3 text-white" style={{ color: colors.focus.ring }} />
                                        </div>
                                        Get extension
                                    </Button>
                                )}
                            </div>

                            {/* Wellness Stats */}
                            <div className="bg-white/20 rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col items-center backdrop-blur-sm w-full md:flex-1 md:max-w-[140px]">
                                <p className="text-xs text-white text-opacity-90">Wellness score</p>
                                {wellnessScore !== null ? (
                                    <div className="flex flex-row items-center gap-1.5">
                                        <div className="bg-white/30 p-1 rounded-full" style={{ backgroundColor: colors.wellness.background }}>
                                            <Heart className="size-3 text-white" style={{ color: colors.wellness.ring }} />
                                        </div>
                                        <span className="text-lg font-medium text-white">{wellnessScore}</span>
                                    </div>
                                ) : (
                                    <Button
                                        className="mt-1 bg-white/30 hover:bg-white/40 text-white text-xs font-medium py-1 px-2 rounded-md flex items-center gap-1 transition-colors"
                                        onClick={() => {
                                            const today = new Date();
                                            setSelectedDate(today);
                                            setShowMoodModal(true);
                                        }}
                                    >
                                        <div className="bg-white/30 p-1 rounded-full" style={{ backgroundColor: colors.wellness.background }}>
                                            <Heart className="size-3 text-white" style={{ color: colors.wellness.ring }} />
                                        </div>
                                        Check in
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend - Matching colors and enhanced contrast */}
                <div className="flex flex-row md:flex-col justify-center text-xs text-white text-opacity-90 bg-white/10 py-2 px-4 rounded-lg backdrop-blur-sm md:w-full w-auto gap-3 md:max-w-[280px]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.focus.ring }}></div>
                        <span>Focus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.wellness.ring }}></div>
                        <span>Wellness</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.combined.ring }}></div>
                        <span>Combined</span>
                    </div>
                </div>
            </div>

            {showMoodModal && selectedDate && (
                <MoodTrackingModal
                    user={user}
                    isOpen={showMoodModal}
                    setIsOpen={setShowMoodModal}
                    selectedDate={selectedDate.toISOString()}
                    dateLabel={getFormattedDateLabel(selectedDate)}
                    onComplete={() => {
                        setShowMoodModal(false);
                        setSelectedDate(null);
                        loadScores();
                    }}
                />
            )}
        </TooltipProvider>
    );
}