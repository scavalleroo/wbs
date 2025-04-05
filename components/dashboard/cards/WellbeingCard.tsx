'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WellbeingCardProps {
    isLoading: boolean;
    wellnessScore: number | null;
    hasRecentMoodData: boolean;
    getWellnessEmoji: (score: number | null) => string;
    onTrackMoodClick: () => void;
    className?: string;
}

export function WellbeingCard({
    wellnessScore,
    hasRecentMoodData,
    getWellnessEmoji,
    onTrackMoodClick,
    className
}: WellbeingCardProps) {

    return (
        <div className={cn(
            "relative w-full rounded-2xl p-6 overflow-hidden bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600 shadow-[0_0_15px_rgba(192,38,211,0.4)]",
            className
        )}>
            {/* Decorative circles */}
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 -mb-48 -mr-24 z-0"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-white/10 -mb-36 -mr-12 z-0"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/10 -mb-24 -mr-6 z-0"></div>

            {/* Semi-transparent dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            <div className="relative z-10">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold mb-1 flex items-center text-white">
                        <Heart className="mr-2 h-6 w-6 text-white/90" />
                        Wellbeing
                    </h2>
                    <p className="text-white/80">
                        {hasRecentMoodData
                            ? "Your overall wellness score today"
                            : "Track your mood to see your wellness score"
                        }
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        {hasRecentMoodData && wellnessScore !== null ? (
                            <>
                                <div className="text-6xl mr-6">{getWellnessEmoji(wellnessScore)}</div>
                                <div>
                                    <div className="text-3xl font-bold text-white">{wellnessScore}/100</div>
                                    <div className="text-white/70">Wellness Score</div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xl text-white/80">
                                No recent mood data available
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    onClick={onTrackMoodClick}
                    className="w-full py-6 text-lg bg-white hover:bg-white/90 text-purple-600 flex items-center justify-center gap-2 shadow-lg font-medium"
                >
                    <Heart className="h-5 w-5" />
                    {hasRecentMoodData ? 'Update Mood' : 'Track Mood'}
                </Button>
            </div>
        </div>
    );
}

export default WellbeingCard;