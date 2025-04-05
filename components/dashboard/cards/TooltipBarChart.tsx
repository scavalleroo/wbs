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
    // Filter out items with 0 or less time spent
    const filteredItems = items.filter(item => item.timeSpent > 0);

    const total = filteredItems.reduce((sum, item) => sum + item.timeSpent, 0);
    const isOverLimit = total > limit;

    // Improved color palette with 5 distinct high-contrast colors
    const getColor = (domain: string, index: number) => {
        // Core set of 5 highly distinguishable colors that work well in both modes
        const colors = [
            'bg-blue-600',     // Blue
            'bg-amber-500',    // Amber/Gold
            'bg-emerald-600',  // Green
            'bg-rose-600',     // Red/Rose
            'bg-violet-600'    // Purple/Violet
        ];

        // Create a consistent mapping between domains and colors
        // If custom color is provided, use it
        if (filteredItems[index]?.color) return filteredItems[index].color;

        // Otherwise, map domain to a specific color index
        const uniqueDomains = [...new Set(filteredItems.map(item => item.domain))];
        const domainIndex = uniqueDomains.indexOf(domain);

        // This ensures each unique domain gets its own color in a deterministic way
        return colors[domainIndex % colors.length];
    };

    // Sort items by time spent (descending)
    const sortedItems = [...filteredItems].sort((a, b) => b.timeSpent - a.timeSpent);

    return (
        <div className="mt-2 mb-2">
            <div className="text-[10px] mb-1 flex justify-between">
                <span>Apps usage:</span>
                <span>{formatFn(total)}/{formatFn(limit)}</span>
            </div>
            <div className="relative rounded-sm overflow-hidden" style={{ width: maxWidth, height }}>
                {/* Background track */}
                <div className="absolute inset-0 bg-gray-700 opacity-50"></div>

                {/* Stacked bars */}
                {sortedItems.length > 0 ? (
                    <div className="flex h-full">
                        {sortedItems.map((item, i) => {
                            const widthPercent = (item.timeSpent / Math.max(limit, total)) * 100;
                            return (
                                <div
                                    key={i}
                                    className={`h-full relative group ${item.color || getColor(item.domain, i)}`}
                                    style={{ width: `${widthPercent}%` }}
                                >
                                    {/* Hoverable domain info */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
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

            {/* Legend for items - Vertical layout sorted by usage */}
            <div className="mt-2 space-y-1">
                {sortedItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-sm mr-1 ${item.color || getColor(item.domain, i)}`}></div>
                            <span className="truncate" style={{ maxWidth: '90px' }}>{item.domain}</span>
                        </div>
                        <span className="text-[9px] text-white/80">{formatFn(item.timeSpent)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};