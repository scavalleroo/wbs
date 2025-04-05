// Add imports at the top
import { useState, useEffect, useMemo } from 'react';

// Add these helper components for the tooltip charts
export const TooltipBarChart = ({
    value,
    limit,
    maxWidth = 150,
    height = 12,
    formatFn
}: {
    value: number;
    limit: number;
    maxWidth?: number;
    height?: number;
    formatFn: (val: number) => string;
}) => {
    // Calculate percentage for bar width (max 200% of limit to handle large overages)
    const percentage = Math.min((value / limit) * 100, 200);
    const isOverLimit = value > limit;

    return (
        <div className="mt-1 mb-2">
            <div className="flex justify-between text-[10px] mb-1">
                <div>{formatFn(value)}</div>
                <div>Limit: {formatFn(limit)}</div>
            </div>
            <div className="relative" style={{ width: maxWidth, height }}>
                {/* Background track */}
                <div className="absolute inset-0 bg-gray-700 rounded-sm opacity-50"></div>

                {/* Value bar */}
                <div
                    className={`absolute top-0 bottom-0 left-0 rounded-sm ${isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>

                {/* Limit line */}
                <div className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${Math.min(100, 100)}%` }}></div>
            </div>
        </div>
    );
};

export const TooltipStackedBar = ({
    items,
    limit,
    maxWidth = 150,
    height = 16,
    formatFn
}: {
    items: { domain: string; timeSpent: number; color?: string }[];
    limit: number;
    maxWidth?: number;
    height?: number;
    formatFn: (val: number) => string;
}) => {
    const total = items.reduce((sum, item) => sum + item.timeSpent, 0);
    const isOverLimit = total > limit;

    // Generate consistent colors for domains
    const getColor = (domain: string, index: number) => {
        // Simple color palette for the domains
        const colors = [
            'bg-blue-500', 'bg-purple-500', 'bg-yellow-500',
            'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'
        ];

        // Use hash of domain to pick a color, or fallback to index
        const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length] || colors[index % colors.length];
    };

    return (
        <div className="mt-2 mb-2">
            <div className="text-[10px] mb-1 flex justify-between">
                <span>Apps usage breakdown:</span>
                <span>{formatFn(total)}</span>
            </div>
            <div className="relative rounded-sm overflow-hidden" style={{ width: maxWidth, height }}>
                {/* Background track */}
                <div className="absolute inset-0 bg-gray-700 opacity-50"></div>

                {/* Stacked bars */}
                {items.length > 0 ? (
                    <div className="flex h-full">
                        {items.map((item, i) => {
                            const widthPercent = (item.timeSpent / Math.max(limit, total)) * 100;
                            return (
                                <div
                                    key={i}
                                    className={`h-full relative group ${item.color || getColor(item.domain, i)}`}
                                    style={{ width: `${widthPercent}%` }}
                                >
                                    {/* Hoverable domain info */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap pointer-events-none">
                                        {item.domain}: {formatFn(item.timeSpent)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-[9px] text-white/70">No data</div>
                )}

                {/* Limit line */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-white"
                    style={{ left: `${Math.min((limit / Math.max(limit, total)) * 100, 100)}%` }}
                ></div>
            </div>

            {/* Legend for items */}
            <div className="flex flex-wrap gap-x-2 mt-1">
                {items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center text-[9px]">
                        <div className={`w-2 h-2 rounded-sm mr-1 ${item.color || getColor(item.domain, i)}`}></div>
                        <span className="truncate" style={{ maxWidth: '60px' }}>{item.domain}</span>
                    </div>
                ))}
                {items.length > 3 && (
                    <div className="text-[9px] text-white/70">+{items.length - 3} more</div>
                )}
            </div>
        </div>
    );
};