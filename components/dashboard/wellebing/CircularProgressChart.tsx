'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressChartProps {
    combinedScore: number | null;
    wellnessScore: number | null;
    focusScore: number | null;
    size?: string;
    className?: string;
    colors?: {
        focus: {
            ring: string;
            background: string;
        };
        wellness: {
            ring: string;
            background: string;
        };
        combined: {
            ring: string;
            background: string;
        };
    };
    showLegend?: boolean;
    textColor?: string;
    legendTextColor?: string;
}

export default function CircularProgressChart({
    combinedScore,
    wellnessScore,
    focusScore,
    size = "w-28 h-28",
    className,
    colors = {
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
    },
    showLegend = true,
    textColor = "fill-white",
    legendTextColor = "text-white/90"
}: CircularProgressChartProps) {
    return (
        <div className="flex flex-col items-center">
            {/* Chart container */}
            <div className={cn("relative flex-shrink-0 mx-auto", size, className)}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    {/* Background circles */}
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

                    {/* Progress circles */}
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

                    {/* Center circle */}
                    <circle
                        cx="50" cy="50" r="19"
                        fill="rgba(255,255,255,0.25)"
                        className="dark:fill-purple-900/40"
                    />

                    {/* Score text */}
                    <text
                        x="50"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="16"
                        className={cn("text-[14px] sm:text-[16px] md:text-[20px] font-semibold select-none", textColor)}
                    >
                        {combinedScore !== null ? combinedScore : '–'}
                    </text>
                </svg>
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="flex justify-center gap-3 w-full mt-2 mb-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.combined.ring }}></div>
                        <span className={cn("text-[10px]", legendTextColor)}>Combined</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.wellness.ring }}></div>
                        <span className={cn("text-[10px]", legendTextColor)}>Wellness</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.focus.ring }}></div>
                        <span className={cn("text-[10px]", legendTextColor)}>Focus</span>
                    </div>
                </div>
            )}
        </div>
    );
}