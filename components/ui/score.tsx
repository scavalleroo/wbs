import React from "react";

type ScoreTier = {
    tier: string;
    color: string;
    background: string;
};

// Score tiers and helper functions for consistent scoring across the app
export const getScoreTier = (score: number | null): ScoreTier => {
    if (score === null) return { tier: "N/A", color: "#6B7280", background: "#D1D5DB" };

    if (score <= 20) return { tier: "Very Poor", color: "#EF4444", background: "rgba(239, 68, 68, 0.2)" }; // Red
    if (score <= 40) return { tier: "Poor", color: "#F97316", background: "rgba(249, 115, 22, 0.2)" }; // Orange
    if (score <= 60) return { tier: "Fair", color: "#EAB308", background: "rgba(234, 179, 8, 0.2)" }; // Yellow
    if (score <= 80) return { tier: "Good", color: "#84CC16", background: "rgba(132, 204, 22, 0.2)" }; // Light Green
    if (score <= 95) return { tier: "Excellent", color: "#22C55E", background: "rgba(34, 197, 94, 0.2)" }; // Dark Green
    return { tier: "Superior", color: "#3B82F6", background: "rgba(59, 130, 246, 0.2)" }; // Blue
};

type ScoreLineProps = {
    score: number | null;
    label: string;
    color?: string;
};

export const ScoreLine: React.FC<ScoreLineProps> = ({ score, label, color }) => {
    const { tier, color: tierColor } = getScoreTier(score);

    // Calculate position (0-100%)
    const position = score !== null ? `${score}%` : '0%';

    return (
        <div className="w-full mt-0 mb-1">
            <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs text-white text-opacity-90">{label}</span>
                {score !== null && (
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-white mr-1.5">{score}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
                            {tier}
                        </span>
                    </div>
                )}
            </div>

            <div className="relative h-2 rounded-full overflow-hidden">
                {/* Background segments */}
                <div className="absolute inset-0 flex">
                    <div className="h-full flex-1 bg-red-500" style={{ flex: '20' }}></div>
                    <div className="h-full flex-1 bg-orange-500" style={{ flex: '20' }}></div>
                    <div className="h-full flex-1 bg-yellow-500" style={{ flex: '20' }}></div>
                    <div className="h-full flex-1 bg-lime-500" style={{ flex: '20' }}></div>
                    <div className="h-full flex-1 bg-green-600" style={{ flex: '15' }}></div>
                    <div className="h-full flex-1 bg-blue-500" style={{ flex: '5' }}></div>
                </div>

                {/* Indicator */}
                {score !== null && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white transform -translate-x-1/2"
                        style={{ left: position, backgroundColor: color || tierColor }}
                    ></div>
                )}
            </div>
        </div>
    );
};

type ScoreScaleLegendProps = {
    compact?: boolean;
};

export const ScoreScaleLegend: React.FC<ScoreScaleLegendProps> = ({ compact = false }) => {
    if (compact) {
        return (
            <div className="text-center text-[10px] text-white/90 bg-white/10 py-1.5 px-2 rounded-lg backdrop-blur-sm w-full">
                <div className="grid grid-cols-6 gap-x-1">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mb-0.5"></div>
                        <span>Superior</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-green-600 mb-0.5"></div>
                        <span>Excellent</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-lime-500 mb-0.5"></div>
                        <span>Good</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mb-0.5"></div>
                        <span>Fair</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mb-0.5"></div>
                        <span>Poor</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mb-0.5"></div>
                        <span>Very Poor</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-[10px] text-white/90 bg-white/10 py-2 px-3 rounded-lg backdrop-blur-sm w-full">
            <div className="flex flex-col space-y-1">
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                    <span className="mr-1">Superior</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">96-100</span>
                </div>
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-green-600 mr-1.5"></div>
                    <span className="mr-1">Excellent</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">81-95</span>
                </div>
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-lime-500 mr-1.5"></div>
                    <span className="mr-1">Good</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">61-80</span>
                </div>
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
                    <span className="mr-1">Fair</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">41-60</span>
                </div>
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></div>
                    <span className="mr-1">Poor</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">21-40</span>
                </div>
                <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
                    <span className="mr-1">Very Poor</span>
                    <div className="flex-grow h-px border-b border-dotted border-white/30"></div>
                    <span className="ml-1">0-20</span>
                </div>
            </div>
        </div>
    );
};

// Combined component for a full score visualization
type ScoreVisualizationProps = {
    scores: {
        label: string;
        score: number | null;
        color?: string;
        actionButton?: React.ReactNode;
    }[];
    showLegend?: boolean;
    compactLegend?: boolean;
};

export const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({
    scores,
    showLegend = true,
    compactLegend = false
}) => {
    return (
        <div className="flex flex-col w-full gap-4 pt-3">
            {/* Score lines */}
            <div className="flex flex-col w-full space-y-3">
                {scores.map((scoreData, index) => (
                    <div key={index} className="flex flex-col w-full">
                        <ScoreLine
                            score={scoreData.score}
                            label={scoreData.label}
                            color={scoreData.color}
                        />
                        {scoreData.actionButton && (
                            <div className="self-end -mt-1">
                                {scoreData.actionButton}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            {showLegend && (
                <ScoreScaleLegend compact={compactLegend} />
            )}
        </div>
    );
};

export default ScoreVisualization;