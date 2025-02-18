import React from 'react';
import { format, addMinutes } from 'date-fns';
import { PlanActivity } from '@/types/plan';
import { MINUTE_HEIGHT } from '@/utils/helpers';

interface TimeGridEventProps {
    activity: PlanActivity;
}

export const TimeGridEvent: React.FC<TimeGridEventProps> = ({ activity }) => {
    const startTime = new Date(activity.scheduled_timestamp);
    const endTime = addMinutes(startTime, activity.duration || 60);
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();

    return (
        <div
            className="absolute left-0 right-0 mx-1 rounded-lg p-2 overflow-hidden text-xs"
            style={{
                top: `${startMinutes * MINUTE_HEIGHT}px`,
                height: `${(activity.duration ?? 60) * MINUTE_HEIGHT}px`,
                backgroundColor: activity.status === 'Completed'
                    ? 'rgb(134 239 172 / 0.9)'
                    : 'rgb(147 197 253 / 0.9)',
            }}
        >
            <div className="font-semibold truncate">{activity.description}</div>
            <div className="text-xs opacity-75">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </div>
        </div>
    );
};