import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBlockedSite } from "@/hooks/use-blocked-site";
import useMood from "@/hooks/use-mood";
import { User } from "@supabase/supabase-js";
import { Download, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import MoodTrackingModal from "../../../moodTracking/MoodTrackingModal";
import ScoreVisualization, { ScoreScaleLegend } from "@/components/ui/score";

export const ScoreDisplay = ({ user, setTimeRange, timeRange }: {
    user: User | null | undefined;
    setTimeRange: ((value: string) => void) | undefined,
    timeRange: 'week' | 'month' | 'year'
}) => {
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
    }, [user, getMoodHistory, getFocusData]);

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

    if (isLoading) {
        return (
            <TooltipProvider>
                <div className="flex flex-col px-3 py-4 md:w-80 w-full md:py-6 items-center bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md gap-6 dark:from-indigo-950 dark:to-purple-950 overflow-hidden flex-col md:items-center md:justify-between">
                    {/* Title placeholder */}
                    <div className="flex items-center md:justify-center w-full text-white text-lg font-bold">
                        Dashboard
                    </div>

                    <div className="flex flex-col items-center gap-2 -mt-6 w-full">
                        <p className="w-full text-xs text-white md:text-center text-left text-opacity-90">Today's score</p>

                        {/* Loading skeleton */}
                        <div className="relative w-28 h-28 flex-shrink-0 mx-auto">
                            <div className="animate-pulse rounded-full bg-white/20 h-full w-full"></div>
                        </div>

                        <div className="flex justify-center gap-3 w-full mt-2 mb-3">
                            <div className="h-3 w-20 bg-white/20 rounded-full animate-pulse"></div>
                            <div className="h-3 w-20 bg-white/20 rounded-full animate-pulse"></div>
                            <div className="h-3 w-20 bg-white/20 rounded-full animate-pulse"></div>
                        </div>

                        <div className="w-full space-y-3 mt-4">
                            <div className="animate-pulse space-y-1">
                                <div className="flex justify-between">
                                    <div className="h-3 bg-white/30 rounded w-20"></div>
                                    <div className="h-3 bg-white/30 rounded w-16"></div>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full w-full"></div>
                            </div>

                            <div className="animate-pulse space-y-1">
                                <div className="flex justify-between">
                                    <div className="h-3 bg-white/30 rounded w-20"></div>
                                    <div className="h-3 bg-white/30 rounded w-16"></div>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full w-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-white/90 bg-white/10 py-2 px-3 rounded-lg backdrop-blur-sm w-full">
                        <div className="animate-pulse flex flex-col space-y-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-2 bg-white/20 rounded-full w-full"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }

    // Prepare score data for the visualization component
    const scoreData = [
        {
            label: "Digital Wellebing Score",
            score: focusScore,
            color: colors.focus.ring,
            actionButton: focusScore === null ? (
                <Button
                    className="bg-white/30 hover:bg-white/40 text-white text-xs font-medium py-1 px-2 rounded-md flex items-center gap-1 transition-colors"
                    onClick={() => window.open('/extension', '_blank')}
                >
                    <Download className="size-3 text-white" />
                    Get extension
                </Button>
            ) : undefined
        },
        {
            label: "Wellness Score",
            score: wellnessScore,
            color: colors.wellness.ring,
            actionButton: wellnessScore === null ? (
                <Button
                    className="bg-white/30 hover:bg-white/40 text-white text-xs font-medium py-1 px-2 rounded-md flex items-center gap-1 transition-colors"
                    onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setShowMoodModal(true);
                    }}
                >
                    <Heart className="size-3 text-white" />
                    Check in
                </Button>
            ) : undefined
        },
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-col px-3 py-4 md:w-80 w-full md:py-6 items-center bg-gradient-to-b from-indigo-800 to-purple-900 rounded-xl shadow-md gap-4 dark:from-indigo-950 dark:to-purple-950 overflow-hidden md:items-center md:justify-between">
                {/* Title with Weko logo */}
                <div className="flex items-center md:justify-center w-full text-white text-lg font-bold">
                    Dashboard
                </div>

                <div className="flex flex-col items-center gap-1 -mt-4 w-full">
                    <p className="w-full text-xs text-white md:text-center text-opacity-90">Today's score</p>

                    <div className="flex flex-col items-center w-full justify-between">
                        {/* Circle Progress Display - Keep original */}
                        <div className="relative w-28 h-28 flex-shrink-0 mx-auto">
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
                                    className="text-[14px] sm:text-[16px] md:text-[20px] font-semibold fill-white select-none"
                                >
                                    {combinedScore !== null ? combinedScore : '–'}
                                </text>
                            </svg>
                        </div>

                        {/* Circle legend - compact version */}
                        <div className="flex justify-center gap-3 w-full mt-2 mb-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.combined.ring }}></div>
                                <span className="text-[10px] text-white/90">Combined</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.wellness.ring }}></div>
                                <span className="text-[10px] text-white/90">Wellness</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.focus.ring }}></div>
                                <span className="text-[10px] text-white/90">Focus</span>
                            </div>
                        </div>

                        {/* Use the new ScoreVisualization component */}
                        <ScoreVisualization scores={scoreData} showLegend={false} />
                    </div>
                </div>

                <ScoreScaleLegend />
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
};