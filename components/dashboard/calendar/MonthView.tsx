import React from 'react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { PlanActivity } from '@/types/plan';

interface MonthViewProps {
    currentDate: Date;
    activities: PlanActivity[];
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, activities }) => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = startOfWeek(firstDayOfMonth);
    const endDate = endOfWeek(lastDayOfMonth);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks = [];

    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const getDayActivities = (date: Date) => {
        return activities.filter(activity =>
            isSameDay(new Date(activity.scheduled_timestamp), date)
        );
    };

    return (
        <div className="grid grid-cols-7 gap-1">
            <div className="col-span-7 grid grid-cols-7">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="p-2 text-center font-semibold">
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{day.charAt(0)}</span>
                    </div>
                ))}
            </div>
            {weeks.map((week, weekIndex) => (
                <React.Fragment key={weekIndex}>
                    {week.map((day, dayIndex) => {
                        const dayActivities = getDayActivities(day);
                        return (
                            <div
                                key={dayIndex}
                                className={`
                                    min-h-16 md:min-h-24 p-1 border rounded-lg
                                    ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900' : ''}
                                    ${day.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 dark:bg-gray-800' : ''}
                                `}
                            >
                                <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
                                <div className="space-y-1 max-h-24 md:max-h-32 overflow-y-auto">
                                    {dayActivities.map(activity => (
                                        <div
                                            key={activity.id}
                                            className="p-2 text-xs bg-blue-100 dark:bg-blue-800 rounded"
                                        >
                                            <div className="hidden md:block">{activity.description}</div>
                                            <div className="md:hidden">
                                                {activity.description.slice(0, 20)}
                                                {activity.description.length > 20 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
};