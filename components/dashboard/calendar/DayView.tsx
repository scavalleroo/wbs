import React from 'react';
import { format } from 'date-fns';
import { PlanActivity } from '@/types/plan';

interface DayViewProps {
    currentDate: Date;
    activities: PlanActivity[];
}

export const DayView: React.FC<DayViewProps> = ({ currentDate, activities }) => (
    <div className="border rounded-lg p-4">
        <div className="text-center mb-4">
            <div className="font-semibold text-lg">{format(currentDate, 'EEEE')}</div>
            <div className="text-2xl font-bold">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>
        <div className="space-y-4">
            {activities.map(activity => (
                <div key={activity.id} className="p-4 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <div className="font-semibold mb-2">{activity.plan.title}</div>
                    <div className="text-sm">{activity.description}</div>
                    <div className="text-xs text-gray-500 mt-2">Status: {activity.status}</div>
                </div>
            ))}
        </div>
    </div>
);