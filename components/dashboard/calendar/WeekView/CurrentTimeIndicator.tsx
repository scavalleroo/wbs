import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MINUTE_HEIGHT } from '@/utils/helpers';

interface CurrentTimeIndicatorProps {
    currentDate: Date;
    todayColumnIndex: number | null;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
    currentDate,
    todayColumnIndex
}) => {
    const [now, setNow] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, []);

    // Don't render if today isn't in the visible week
    if (todayColumnIndex === null) {
        return null;
    }

    // Calculate position
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const topPosition = totalMinutes * MINUTE_HEIGHT;

    return (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${topPosition}px` }}>
            <div className="relative flex items-center">
                {/* Line extending across day column */}
                <div className="flex w-full">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div
                            key={index}
                            className={`flex-1 relative ${index === todayColumnIndex ? 'border-t-2 border-red-500' : ''}`}
                        >
                            {index === todayColumnIndex && (
                                <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};