import React, { useRef, useEffect, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { PlanActivity } from '@/types/plan';
import { HOUR_HEIGHT, HOURS, MINUTE_HEIGHT, TOTAL_HEIGHT } from '@/utils/helpers';
import { TimeGridEvent } from '../WeekView/TimeGridEvent';

interface DayViewTimeGridProps {
    activities: PlanActivity[];
    currentDate: Date;
    onActivityUpdate?: (updatedActivity: PlanActivity) => void;
    onActivityEdit?: (activityId: number) => void;
    onActivityDelete?: (activityId: number) => void;
}

export const DayViewTimeGrid: React.FC<DayViewTimeGridProps> = ({
    activities,
    currentDate,
    onActivityUpdate,
    onActivityEdit,
    onActivityDelete
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [localActivities, setLocalActivities] = useState<PlanActivity[]>(activities);
    const [selectedActivity, setSelectedActivity] = useState<PlanActivity | null>(null);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

    // Check if the displayed day is today
    const isToday = isSameDay(currentDate, new Date());

    useEffect(() => {
        setLocalActivities(activities);
    }, [activities]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const now = new Date();
            const currentHour = now.getHours();

            // Scroll to current time minus 2 hours (or to 8am if earlier)
            const scrollHour = Math.max(8, currentHour - 2);
            scrollContainerRef.current.scrollTop = scrollHour * HOUR_HEIGHT;
        }
    }, []);

    // Handle clicks outside the popup to close it
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectedActivity) {
                const target = e.target as HTMLElement;
                if (!target.closest('.event-popup')) {
                    setSelectedActivity(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedActivity]);

    const handleEventChange = (activity: PlanActivity, newStartTime: Date) => {
        const updatedActivity = {
            ...activity,
            scheduled_timestamp: newStartTime
        };

        // Update local state for immediate UI feedback
        setLocalActivities(prev =>
            prev.map(act => act.id === activity.id ? updatedActivity : act)
        );

        // Notify parent component
        if (onActivityUpdate) {
            onActivityUpdate(updatedActivity);
        }
    };

    const handleEventResize = (activity: PlanActivity, newDuration: number) => {
        const updatedActivity = {
            ...activity,
            duration: newDuration
        };

        // Update local state for immediate UI feedback
        setLocalActivities(prev =>
            prev.map(act => act.id === activity.id ? updatedActivity : act)
        );

        // Notify parent component
        if (onActivityUpdate) {
            onActivityUpdate(updatedActivity);
        }
    };

    const handleEventClick = (activity: PlanActivity, e: React.MouseEvent) => {
        e.stopPropagation();

        // Calculate popup position, ensuring it stays within viewport
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate popup position
        const maxX = window.innerWidth - 280; // Popup width + padding
        const x = Math.min(e.clientX, maxX);

        // Check if popup would go below viewport bottom
        const popupHeight = 180; // Approximate popup height
        const y = e.clientY + popupHeight > window.innerHeight
            ? e.clientY - popupHeight
            : e.clientY;

        setPopupPosition({ x, y });
        setSelectedActivity(activity);
    };

    const handleEditActivity = () => {
        if (selectedActivity && onActivityEdit) {
            onActivityEdit(selectedActivity.id);
            setSelectedActivity(null);
        }
    };

    const handleDeleteActivity = () => {
        if (selectedActivity && onActivityDelete) {
            onActivityDelete(selectedActivity.id);
            setSelectedActivity(null);
        }
    };

    // Filter activities for the current day
    const dailyActivities = localActivities.filter(activity =>
        format(new Date(activity.scheduled_timestamp), 'yyyy-MM-dd') ===
        format(currentDate, 'yyyy-MM-dd')
    );

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] bg-background">
            <div className="flex-none">
                <div className="flex border-b">
                    <div className="w-16 flex-shrink-0" />
                    <div className="flex-1 p-2 text-center">
                        <div className="font-semibold">{format(currentDate, 'EEEE')}</div>
                        <div className={`text-sm ${isToday ? 'bg-blue-100 dark:bg-blue-900 rounded-full px-2 inline-block' : ''}`}>
                            {format(currentDate, 'MMMM d, yyyy')}
                        </div>
                    </div>
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

                    <div className="flex flex-1 relative">
                        {/* Current time indicator, only show if the day is today */}
                        {isToday && (
                            <DayViewCurrentTimeIndicator />
                        )}

                        <div className="flex-1 border-l relative">
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    className="border-b border-gray-200 dark:border-gray-800"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                />
                            ))}

                            {dailyActivities.map(activity => (
                                <TimeGridEvent
                                    key={activity.id}
                                    activity={activity}
                                    onEventChange={handleEventChange}
                                    onEventResize={handleEventResize}
                                    onEventClick={handleEventClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Details Popup */}
                {selectedActivity && (
                    <div
                        className="event-popup fixed bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 border border-gray-200 dark:border-gray-700 z-50 w-64"
                        style={{
                            top: `${popupPosition.y}px`,
                            left: `${popupPosition.x}px`,
                        }}
                    >
                        <h3 className="font-medium text-base mb-2">{selectedActivity.description}</h3>

                        <div className="text-sm space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                                <span>{format(new Date(selectedActivity.scheduled_timestamp), 'h:mm a')}</span>
                            </div>

                            {selectedActivity.duration && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                    <span>
                                        {selectedActivity.duration >= 60
                                            ? `${Math.floor(selectedActivity.duration / 60)}h ${selectedActivity.duration % 60}m`
                                            : `${selectedActivity.duration}m`}
                                    </span>
                                </div>
                            )}

                            {selectedActivity.status && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                    <span className={`${selectedActivity.status === 'Completed'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {selectedActivity.status}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-2 mt-4">
                            <button
                                onClick={handleEditActivity}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded text-sm transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDeleteActivity}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded text-sm transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Day-specific current time indicator component
const DayViewCurrentTimeIndicator = () => {
    const [now, setNow] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, []);

    // Calculate position
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const topPosition = totalMinutes * MINUTE_HEIGHT;

    return (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${topPosition}px` }}>
            <div className="relative flex items-center">
                <div className="flex w-full">
                    <div className="flex-1 border-t-2 border-red-500 relative">
                        <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};