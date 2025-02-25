import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { DayViewTimeGrid } from './DayViewTimeGrid';
import { PlanActivity } from '@/types/plan';

interface CalendarDayProps {
    activities: PlanActivity[];
    initialDate?: Date;
    onActivityUpdate?: (updatedActivity: PlanActivity) => void;
    onActivityEdit?: (activityId: number) => void;
    onActivityDelete?: (activityId: number) => void;
    onDateChange?: (date: Date) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
    activities,
    initialDate = new Date(),
    onActivityUpdate,
    onActivityEdit,
    onActivityDelete,
    onDateChange
}) => {
    const [currentDate, setCurrentDate] = useState<Date>(initialDate);

    const handlePreviousDay = () => {
        const newDate = subDays(currentDate, 1);
        setCurrentDate(newDate);
        if (onDateChange) {
            onDateChange(newDate);
        }
    };

    const handleNextDay = () => {
        const newDate = addDays(currentDate, 1);
        setCurrentDate(newDate);
        if (onDateChange) {
            onDateChange(newDate);
        }
    };

    const handleTodayClick = () => {
        const today = new Date();
        setCurrentDate(today);
        if (onDateChange) {
            onDateChange(today);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex space-x-2">
                    <button
                        onClick={handlePreviousDay}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNextDay}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <h2 className="text-xl font-semibold">
                    {format(currentDate, 'MMMM d, yyyy')}
                </h2>

                <button
                    onClick={handleTodayClick}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                    Today
                </button>
            </div>

            <DayViewTimeGrid
                activities={activities}
                currentDate={currentDate}
                onActivityUpdate={onActivityUpdate}
                onActivityEdit={onActivityEdit}
                onActivityDelete={onActivityDelete}
            />
        </div>
    );
};