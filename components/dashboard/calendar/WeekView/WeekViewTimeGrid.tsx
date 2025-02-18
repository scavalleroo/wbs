import React, { useRef, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { TimeGridEvent } from './TimeGridEvent';
import { PlanActivity } from '@/types/plan';
import { HOUR_HEIGHT, HOURS, TOTAL_HEIGHT } from '@/utils/helpers';

interface WeekViewTimeGridProps {
    activities: PlanActivity[];
    currentDate: Date;
}

export const WeekViewTimeGrid: React.FC<WeekViewTimeGridProps> = ({ activities, currentDate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT;
        }
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] bg-background">
            <div className="flex-none">
                <div className="flex border-b">
                    <div className="w-16 flex-shrink-0" />
                    {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex-1 p-2 text-center border-l">
                            <div className="font-semibold">{format(day, 'EEE')}</div>
                            <div className={`text-sm ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                    ? 'bg-blue-100 dark:bg-blue-900 rounded-full px-2'
                                    : ''
                                }`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
                <div className="flex absolute w-full" style={{ height: `${TOTAL_HEIGHT}px` }}>
                    <div className="w-16 flex-shrink-0 sticky left-0 bg-background z-10">
                        {HOURS.map(hour => (
                            <div
                                key={hour}
                                className="text-xs text-gray-500 text-right pr-2 flex items-center justify-end"
                                style={{ height: `${HOUR_HEIGHT}px`, marginTop: hour === 0 ? 0 : '-1px' }}
                            >
                                {format(new Date().setHours(hour, 0), 'ha')}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-1">
                        {weekDays.map((day, dayIndex) => (
                            <div key={dayIndex} className="flex-1 border-l relative">
                                {HOURS.map(hour => (
                                    <div
                                        key={hour}
                                        className="border-b border-gray-200 dark:border-gray-800"
                                        style={{ height: `${HOUR_HEIGHT}px` }}
                                    />
                                ))}

                                {activities
                                    .filter(activity =>
                                        format(activity.scheduled_timestamp, 'yyyy-MM-dd') ===
                                        format(day, 'yyyy-MM-dd')
                                    )
                                    .map(activity => (
                                        <TimeGridEvent key={activity.id} activity={activity} />
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};