import React, { useState, useRef } from 'react';
import { format, addMinutes } from 'date-fns';
import { PlanActivity } from '@/types/plan';
import { MINUTE_HEIGHT } from '@/utils/helpers';

interface TimeGridEventProps {
    activity: PlanActivity;
    onEventChange?: (activity: PlanActivity, newStartTime: Date) => void;
    onEventResize?: (activity: PlanActivity, newDuration: number) => void;
    onEventClick?: (activity: PlanActivity, e: React.MouseEvent) => void;
}

export const TimeGridEvent: React.FC<TimeGridEventProps> = ({
    activity,
    onEventChange,
    onEventResize,
    onEventClick
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const eventRef = useRef<HTMLDivElement>(null);
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef<number>(0);
    const resizeStartY = useRef<number>(0);
    const dragStartTime = useRef<Date>(new Date(activity.scheduled_timestamp));
    const resizeStartDuration = useRef<number>(activity.duration || 60);

    const startTime = new Date(activity.scheduled_timestamp);
    const endTime = addMinutes(startTime, activity.duration || 60);
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();

    const handleDragStart = (e: React.MouseEvent) => {
        // Don't start dragging if we're resizing
        if (isResizing) return;

        e.preventDefault();
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartTime.current = new Date(activity.scheduled_timestamp);

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!isDragging || !eventRef.current) return;

        const deltaY = e.clientY - dragStartY.current;
        const currentTop = startMinutes * MINUTE_HEIGHT;
        const newTop = Math.max(0, currentTop + deltaY);

        // Ensure the event stays within the column (max 24 hours)
        const maxTop = 24 * 60 * MINUTE_HEIGHT - (activity.duration || 60) * MINUTE_HEIGHT;
        const boundedTop = Math.min(newTop, maxTop);

        eventRef.current.style.top = `${boundedTop}px`;
        eventRef.current.style.opacity = '0.7';
    };

    const handleDragEnd = (e: MouseEvent) => {
        if (!isDragging || !eventRef.current) return;

        // Reset opacity
        eventRef.current.style.opacity = '1';
        setIsDragging(false);

        // Calculate time change
        const deltaY = e.clientY - dragStartY.current;
        const deltaMinutes = Math.round(deltaY / MINUTE_HEIGHT);

        // Only update if the change is significant
        if (Math.abs(deltaMinutes) >= 5 && onEventChange) {
            const newStartTime = new Date(dragStartTime.current);
            newStartTime.setMinutes(newStartTime.getMinutes() + deltaMinutes);

            // Ensure we don't go before midnight
            if (newStartTime.getDate() === dragStartTime.current.getDate()) {
                onEventChange(activity, newStartTime);
            } else {
                // Reset to original position if crossing day boundary
                eventRef.current.style.top = `${startMinutes * MINUTE_HEIGHT}px`;
            }
        } else {
            // Reset position if change was minimal
            eventRef.current.style.top = `${startMinutes * MINUTE_HEIGHT}px`;
        }

        // Remove event listeners
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!isDragging && onEventClick) {
            onEventClick(activity, e);
        }
    };

    // Resize event handlers
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drag start
        setIsResizing(true);
        resizeStartY.current = e.clientY;
        resizeStartDuration.current = activity.duration || 60;

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing || !eventRef.current) return;

        const deltaY = e.clientY - resizeStartY.current;
        const deltaMinutes = Math.round(deltaY / MINUTE_HEIGHT);
        const newDuration = Math.max(15, resizeStartDuration.current + deltaMinutes);

        const startDateTime = new Date(activity.scheduled_timestamp);
        const minutesUntilMidnight = 24 * 60 - (startDateTime.getHours() * 60 + startDateTime.getMinutes());
        const maxDuration = Math.min(newDuration, minutesUntilMidnight);

        eventRef.current.style.height = `${maxDuration * MINUTE_HEIGHT}px`;
        eventRef.current.style.opacity = '0.7';
    };

    const handleResizeEnd = (e: MouseEvent) => {
        if (!isResizing || !eventRef.current) return;

        eventRef.current.style.opacity = '1';
        setIsResizing(false);

        const deltaY = e.clientY - resizeStartY.current;
        const deltaMinutes = Math.round(deltaY / MINUTE_HEIGHT);
        const newDuration = Math.max(15, resizeStartDuration.current + deltaMinutes);

        const startDateTime = new Date(activity.scheduled_timestamp);
        const minutesUntilMidnight = 24 * 60 - (startDateTime.getHours() * 60 + startDateTime.getMinutes());
        const boundedDuration = Math.min(newDuration, minutesUntilMidnight);

        if (Math.abs(boundedDuration - resizeStartDuration.current) >= 5 && onEventResize) {
            onEventResize(activity, boundedDuration);
        } else {
            eventRef.current.style.height = `${(activity.duration ?? 60) * MINUTE_HEIGHT}px`;
        }

        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    };

    return (
        <div
            ref={eventRef}
            className={`absolute left-0 right-0 mx-1 rounded-lg p-2 overflow-hidden text-xs ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            style={{
                top: `${startMinutes * MINUTE_HEIGHT}px`,
                height: `${(activity.duration ?? 60) * MINUTE_HEIGHT}px`,
                backgroundColor: activity.status === 'Completed'
                    ? 'rgb(134 239 172 / 0.9)'
                    : 'rgb(147 197 253 / 0.9)',
                zIndex: isDragging || isResizing ? 10 : 1,
                transition: isDragging || isResizing ? 'none' : 'opacity 0.2s ease',
            }}
            onMouseDown={handleDragStart}
            onClick={handleClick}
        >
            <div className="font-semibold truncate">{activity.description}</div>
            <div className="text-xs opacity-75">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </div>

            <div
                ref={resizeHandleRef}
                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black bg-opacity-10 hover:bg-opacity-20"
                onMouseDown={handleResizeStart}
            />
        </div>
    );
};