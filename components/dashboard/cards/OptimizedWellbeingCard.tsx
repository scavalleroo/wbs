'use client';

import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Sparkles, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OptimizedWellbeingCardProps {
    isLoading: boolean;
    wellnessScore: number | null;
    hasRecentMoodData: boolean;
    getWellnessEmoji: (score: number | null) => string;
    onTrackMoodClick: () => void;
    onRelaxClick: () => void;
    isMobile?: boolean;
}

export function OptimizedWellbeingCard({
    isLoading,
    wellnessScore,
    hasRecentMoodData,
    getWellnessEmoji,
    onTrackMoodClick,
    onRelaxClick,
    isMobile = false
}: OptimizedWellbeingCardProps) {
    // Get wellness color based on score
    const getWellnessColor = () => {
        if (wellnessScore === null) return '#94A3B8'; // gray-400
        if (wellnessScore >= 90) return '#3B82F6'; // blue-500  
        if (wellnessScore >= 75) return '#10B981'; // green-500
        if (wellnessScore >= 60) return '#34D399'; // green-400
        if (wellnessScore >= 45) return '#FACC15'; // yellow-500
        if (wellnessScore >= 30) return '#F97316'; // orange-500
        return '#EF4444'; // red-500
    };

    // Get emoji from wellness score
    const emoji = getWellnessEmoji(wellnessScore);

    // Get display for score
    const scoreDisplay = wellnessScore !== null ? wellnessScore : '?';

    // Get message based on data availability
    const getMessage = () => {
        if (wellnessScore === null || !hasRecentMoodData) {
            return "Track today's wellbeing";
        }
        if (wellnessScore >= 75) {
            return "You're doing great!";
        }
        if (wellnessScore >= 50) {
            return "You're doing ok";
        }
        return "Could be better";
    };

    // Mobile-optimized layout
    if (isMobile) {
        return (
            <div className="rounded-xl p-4 bg-gradient-to-r from-purple-400 to-pink-500 shadow-sm text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 z-0"></div>

                <div className="relative z-10">
                    {/* Two-column layout for mobile */}
                    <div className="flex items-center">
                        {/* Left column: Progress */}
                        <div className="mr-3 flex-shrink-0">
                            <div className="w-16 h-16">
                                <CircularProgressbar
                                    value={wellnessScore || 0}
                                    text={`${scoreDisplay}`}
                                    maxValue={100}
                                    strokeWidth={10}
                                    styles={buildStyles({
                                        textSize: '22px',
                                        pathColor: getWellnessColor(),
                                        textColor: '#ffffff',
                                        trailColor: 'rgba(255,255,255,0.2)',
                                    })}
                                />
                            </div>
                        </div>

                        {/* Right column: Info */}
                        <div className="flex-grow">
                            <div className="flex justify-between items-center">
                                <h2 className="font-bold flex items-center text-sm">
                                    <HeartPulse className="mr-1.5 h-3.5 w-3.5" />
                                    Wellbeing
                                </h2>
                                <div className="text-xl">
                                    {emoji}
                                </div>
                            </div>

                            <p className="text-sm mt-1">{getMessage()}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                        <Button
                            onClick={onTrackMoodClick}
                            className="flex-1 h-9 py-1 flex items-center justify-center bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            {hasRecentMoodData ? "Update" : "Track"}
                        </Button>
                        <Button
                            onClick={onRelaxClick}
                            className="flex-1 h-9 py-1 flex items-center justify-center bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                        >
                            <HeartPulse className="h-3.5 w-3.5 mr-1" />
                            Relax Now
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop layout with added relax button
    return (
        <div className="rounded-xl p-4 bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600 shadow-[0_0_12px_rgba(192,38,211,0.4)] text-white relative overflow-hidden h-full">
            {/* Decorative background elements */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>

            <div className="relative z-10">
                {/* Card Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold flex items-center">
                        <HeartPulse className="mr-1.5 h-4 w-4" />
                        Wellbeing
                    </h2>

                    <div className="text-xl">
                        {emoji}
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-3">
                    <div className="w-24 h-24">
                        <CircularProgressbar
                            value={wellnessScore || 0}
                            text={`${scoreDisplay}`}
                            maxValue={100}
                            strokeWidth={10}
                            styles={buildStyles({
                                textSize: '22px',
                                pathColor: getWellnessColor(),
                                textColor: '#ffffff',
                                trailColor: 'rgba(255,255,255,0.2)',
                            })}
                        />
                    </div>
                </div>

                {/* Today's Message */}
                <div className="flex justify-center items-center text-center mb-4">
                    <div className="text-sm">
                        {getMessage()}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={onTrackMoodClick}
                        className="flex-1 flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                    >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        {hasRecentMoodData ? "Update" : "Track"}
                    </Button>
                    <Button
                        onClick={onRelaxClick}
                        className="flex-1 flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                    >
                        <HeartPulse className="h-4 w-4 mr-1.5" />
                        Relax Now
                    </Button>
                </div>
            </div>
        </div>
    );
}