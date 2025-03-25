import React, { useState } from 'react';
import { BlockedSite } from '@/types/report.types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface WeekdayLimits {
    [key: string]: {
        enabled: boolean;
        minutes: number;
    }
}

interface SiteTimeControlsProps {
    site: BlockedSite;
    currentSiteWeekdayLimits: WeekdayLimits;
    toggleSiteDay: (siteId: number, day: string, currentEnabled: boolean) => Promise<void>;
    setSiteTimeLimit: (siteId: number, day: string, minutes: number) => Promise<void>;
    handleUpdateLimit: (id: number, maxVisits: number) => Promise<boolean>;
}

const daysOfWeek = [
    { key: 'monday', label: 'M' },
    { key: 'tuesday', label: 'T' },
    { key: 'wednesday', label: 'W' },
    { key: 'thursday', label: 'T' },
    { key: 'friday', label: 'F' },
    { key: 'saturday', label: 'S' },
    { key: 'sunday', label: 'S' }
];

export function SiteTimeControls({
    site,
    currentSiteWeekdayLimits,
    toggleSiteDay,
    setSiteTimeLimit,
    handleUpdateLimit
}: SiteTimeControlsProps) {
    return (
        <div className="mt-4 pt-4 border-t dark:border-neutral-700">
            {/* Visit limits */}
            <VisitLimitsControl site={site} handleUpdateLimit={handleUpdateLimit} />

            {/* Day-specific time limits */}
            <div className="mt-4">
                <div className="space-y-4">
                    {/* Days of Week Toggles */}
                    <div>
                        <div className="grid grid-cols-7 gap-2">
                            {daysOfWeek.map((day) => {
                                const dayKey = day.key;
                                const dayEnabled = currentSiteWeekdayLimits[dayKey].enabled;

                                return (
                                    <Button
                                        key={day.key}
                                        variant="outline"
                                        size="sm"
                                        className={`w-8 h-8 p-0 ${dayEnabled ?
                                            'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                            'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}
                                        onClick={() => toggleSiteDay(site.id, day.key, dayEnabled)}
                                    >
                                        {day.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Picker */}
                    <TimeLimitsControl
                        site={site}
                        currentSiteWeekdayLimits={currentSiteWeekdayLimits}
                        setSiteTimeLimit={setSiteTimeLimit}
                    />
                </div>
            </div>
        </div>
    );
}

// Update the component definition to include the handleUpdateLimit prop
function VisitLimitsControl({ site, handleUpdateLimit }: { site: BlockedSite, handleUpdateLimit: (id: number, maxVisits: number) => Promise<boolean> }) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Daily visit limit:</Label>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleUpdateLimit(site.id, Math.max(1, site.max_daily_visits - 1))}
                        disabled={site.max_daily_visits <= 1}
                    >
                        <span>-</span>
                    </Button>
                    <span className="w-8 text-center font-medium">{site.max_daily_visits}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleUpdateLimit(site.id, Math.min(20, site.max_daily_visits + 1))}
                        disabled={site.max_daily_visits >= 20}
                    >
                        <span>+</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface TimeLimitsControlProps {
    site: BlockedSite;
    currentSiteWeekdayLimits: WeekdayLimits;
    setSiteTimeLimit: (siteId: number, day: string, minutes: number) => Promise<void>;
}

function TimeLimitsControl({ site, currentSiteWeekdayLimits, setSiteTimeLimit }: TimeLimitsControlProps) {
    const totalMinutes = currentSiteWeekdayLimits.monday.minutes;
    const initialHours = Math.floor(totalMinutes / 60);
    const initialMinutes = totalMinutes % 60;

    const [selectedHour, setSelectedHour] = useState(initialHours);
    const [selectedMinute, setSelectedMinute] = useState(initialMinutes);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Generate hours and minutes options
    const hours = Array.from({ length: 9 }, (_, i) => i); // 0-8 hours
    const minutes = [0, 5, 10, 15, 20, 30, 45];

    // Save changes function - only called when save button is clicked
    const saveTimeChanges = async () => {
        const newTotalMinutes = (selectedHour * 60) + selectedMinute;
        if (newTotalMinutes !== totalMinutes) {
            setIsUpdating(true);

            try {
                // Update all enabled days with the same time
                const promises = daysOfWeek
                    .filter(day => currentSiteWeekdayLimits[day.key].enabled)
                    .map(day => setSiteTimeLimit(site.id, day.key, newTotalMinutes));

                // Wait for all API calls to complete
                await Promise.all(promises);
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error("Failed to update time limits:", error);
            } finally {
                setIsUpdating(false);
            }
        }
    };

    // Handle hour increment/decrement with immediate feedback
    const incrementHour = () => {
        setSelectedHour(prev => Math.min(8, prev + 1));
        setHasUnsavedChanges(true);
    };

    const decrementHour = () => {
        setSelectedHour(prev => Math.max(0, prev - 1));
        setHasUnsavedChanges(true);
    };

    // Handle minute increment/decrement with immediate feedback
    const incrementMinute = () => {
        const currentIndex = minutes.indexOf(selectedMinute);
        if (currentIndex < minutes.length - 1) {
            setSelectedMinute(minutes[currentIndex + 1]);
            setHasUnsavedChanges(true);
        } else if (selectedHour < 8) {
            // Roll over to next hour if possible
            setSelectedHour(prev => prev + 1);
            setSelectedMinute(minutes[0]);
            setHasUnsavedChanges(true);
        }
    };

    const decrementMinute = () => {
        const currentIndex = minutes.indexOf(selectedMinute);
        if (currentIndex > 0) {
            setSelectedMinute(minutes[currentIndex - 1]);
            setHasUnsavedChanges(true);
        } else if (selectedHour > 0) {
            // Roll back to previous hour if possible
            setSelectedHour(prev => prev - 1);
            setSelectedMinute(minutes[minutes.length - 1]);
            setHasUnsavedChanges(true);
        }
    };

    // Add quick preset buttons for common time choices
    const quickPresets = [
        { minutes: 15, label: '15m' },
        { minutes: 30, label: '30m' },
        { minutes: 60, label: '1h' },
        { minutes: 120, label: '2h' }
    ];

    const setQuickPreset = (totalMins: number) => {
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        setSelectedHour(hours);
        setSelectedMinute(mins);
        setHasUnsavedChanges(true);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
                {/* Time Picker Container with 3D effect */}
                <div className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 shadow-inner">
                    {/* Hour Control */}
                    <div className="flex flex-col items-center">
                        {/* Up arrow */}
                        <button
                            onClick={incrementHour}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour >= 8}
                            aria-label="Increase hours"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                            </svg>
                        </button>

                        {/* Hours Display - Fixed Height with 3D effect */}
                        <div className="relative w-16 h-10 flex items-center justify-center overflow-hidden">
                            <div className="wheel-display">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className={`absolute left-0 right-0 flex justify-center transition-all duration-200 ${selectedHour === hour
                                            ? 'opacity-100 transform-none font-bold text-xl text-blue-600 dark:text-blue-400'
                                            : selectedHour === hour - 1
                                                ? 'opacity-60 -translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                : selectedHour === hour + 1
                                                    ? 'opacity-60 translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                    : 'opacity-0 text-neutral-400'
                                            }`}
                                        onClick={() => {
                                            setSelectedHour(hour);
                                            setHasUnsavedChanges(true);
                                        }}
                                    >
                                        {hour}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Down arrow */}
                        <button
                            onClick={decrementHour}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour <= 0}
                            aria-label="Decrease hours"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-lg font-medium mx-2 text-neutral-800 dark:text-neutral-200">h</div>

                    {/* Minutes Control */}
                    <div className="flex flex-col items-center">
                        {/* Up arrow */}
                        <button
                            onClick={incrementMinute}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour >= 8 && minutes.indexOf(selectedMinute) === minutes.length - 1}
                            aria-label="Increase minutes"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                            </svg>
                        </button>

                        {/* Minutes Display - Fixed Height with 3D effect */}
                        <div className="relative w-16 h-10 flex items-center justify-center overflow-hidden">
                            <div className="wheel-display">
                                {minutes.map(minute => {
                                    const currentIndex = minutes.indexOf(selectedMinute);
                                    const minuteIndex = minutes.indexOf(minute);

                                    return (
                                        <div
                                            key={minute}
                                            className={`absolute left-0 right-0 flex justify-center transition-all duration-200 ${selectedMinute === minute
                                                ? 'opacity-100 transform-none font-bold text-xl text-blue-600 dark:text-blue-400'
                                                : currentIndex === minuteIndex - 1
                                                    ? 'opacity-60 -translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                    : currentIndex === minuteIndex + 1
                                                        ? 'opacity-60 translate-y-6 scale-90 text-neutral-600 dark:text-neutral-400'
                                                        : 'opacity-0 text-neutral-400'
                                                }`}
                                            onClick={() => {
                                                setSelectedMinute(minute);
                                                setHasUnsavedChanges(true);
                                            }}
                                        >
                                            {minute.toString().padStart(2, '0')}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Down arrow */}
                        <button
                            onClick={decrementMinute}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour <= 0 && selectedMinute <= 0}
                            aria-label="Decrease minutes"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-lg font-medium mx-2 text-neutral-800 dark:text-neutral-200">m</div>
                </div>
            </div>

            {/* Selected time display */}
            <div className="text-center font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                {isUpdating ?
                    <span className="text-blue-600 dark:text-blue-400">Saving...</span> :
                    `${selectedHour}h ${selectedMinute}m per day`}
                {hasUnsavedChanges && !isUpdating &&
                    <span className="ml-1 text-amber-600 dark:text-amber-400">(unsaved)</span>
                }
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
                {quickPresets.map(preset => (
                    <button
                        key={preset.minutes}
                        onClick={() => setQuickPreset(preset.minutes)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${(selectedHour * 60) + selectedMinute === preset.minutes
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Save button */}
            <Button
                onClick={saveTimeChanges}
                disabled={isUpdating || !hasUnsavedChanges}
                className="mb-3"
                variant={hasUnsavedChanges ? "default" : "outline"}
                size="sm"
            >
                {isUpdating ? "Saving..." : "Save Changes"}
            </Button>

            {/* Mobile touch wheel help - no need to show loader here */}
            <div className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-1 md:hidden">
                <span>Tap numbers or arrows to change</span>
            </div>
        </div>
    );
}

// Helper component for the quick time preset buttons
function QuickTimeButton({ minutes, onClick }: { minutes: number; onClick: () => void }) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const label = hours > 0
        ? mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
        : `${mins}m`;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="px-3 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
            {label}
        </Button>
    );
}