import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface WeekdayLimits {
    [key: string]: {
        enabled: boolean;
        minutes: number;
    }
}

interface PopularSite {
    name: string;
    domain: string;
}

interface AddNewSiteFormProps {
    popularSites: PopularSite[];
    availablePopularSites: PopularSite[];
    loading: boolean;
    newDomain: string;
    setNewDomain: (domain: string) => void;
    domainError: string;
    setDomainError: (error: string) => void;
    newSiteWeekdayLimits: WeekdayLimits;
    toggleNewSiteDay: (day: string) => void;
    setNewSiteTimeLimit: (day: string, minutes: number) => void;
    applyToAllDays: (minutes: number) => void;
    handleAddDomain: (e: React.FormEvent) => Promise<void>;
    handleQuickAdd: (site: PopularSite) => Promise<void>;
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

export function AddNewSiteForm({
    popularSites,
    availablePopularSites,
    loading,
    newDomain,
    setNewDomain,
    domainError,
    setDomainError,
    newSiteWeekdayLimits,
    toggleNewSiteDay,
    setNewSiteTimeLimit,
    applyToAllDays,
    handleAddDomain,
    handleQuickAdd
}: AddNewSiteFormProps) {
    const [maxVisits, setMaxVisits] = useState(3); // Default daily visit limit

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAddDomain(e);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Domain input field */}
            <div className="space-y-2">
                <Input
                    placeholder="Enter domain to block (e.g. youtube.com)"
                    value={newDomain}
                    onChange={(e) => {
                        setNewDomain(e.target.value);
                        setDomainError('');
                    }}
                    className={domainError ? "border-red-500" : ""}
                />
                {domainError && (
                    <p className="text-xs text-red-500">{domainError}</p>
                )}

                {/* Popular site suggestions */}
                {availablePopularSites.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {availablePopularSites.map((site: any) => (
                            <button
                                key={site.domain}
                                type="button"
                                onClick={() => setNewDomain(site.domain)}
                                className="px-2 py-1 text-xs rounded-md bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-neutral-200 dark:border-neutral-700"
                            >
                                {site.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Visit limit settings - more compact */}
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Daily visits:</span>
                <div className="flex items-center space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => setMaxVisits(Math.max(1, maxVisits - 1))}
                        disabled={maxVisits <= 1}
                    >
                        <span>-</span>
                    </Button>
                    <span className="w-6 text-center font-medium">{maxVisits}</span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => setMaxVisits(Math.min(20, maxVisits + 1))}
                        disabled={maxVisits >= 20}
                    >
                        <span>+</span>
                    </Button>
                </div>
            </div>

            {/* Day selection and time settings */}
            <div className="space-y-3">
                {/* Day selection buttons */}
                <div className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map((day) => {
                        const isEnabled = newSiteWeekdayLimits[day.key].enabled;
                        return (
                            <Button
                                key={day.key}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={`w-8 h-8 p-0 ${isEnabled ?
                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                    'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}
                                onClick={() => toggleNewSiteDay(day.key)}
                            >
                                {day.label}
                            </Button>
                        );
                    })}
                </div>

                {/* Time settings */}
                <DayTimeLimitSettings
                    newSiteWeekdayLimits={newSiteWeekdayLimits}
                    toggleNewSiteDay={toggleNewSiteDay}
                    setNewSiteTimeLimit={setNewSiteTimeLimit}
                    applyToAllDays={applyToAllDays}
                />
            </div>

            {/* Submit button */}
            <Button
                type="submit"
                disabled={loading || !newDomain.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 mt-2"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Site
            </Button>
        </form>
    );
}

function DayTimeLimitSettings({ newSiteWeekdayLimits, toggleNewSiteDay, setNewSiteTimeLimit, applyToAllDays }: any) {
    // Get the common time limit (if all days have the same value)
    const timeValues = Object.values(newSiteWeekdayLimits).map((day: any) => day.minutes);
    const allSameTime = timeValues.every(v => v === timeValues[0]);
    const commonTimeMinutes = allSameTime ? timeValues[0] : 30; // Default to 30 if not all the same

    const initialHours = Math.floor(commonTimeMinutes / 60);
    const initialMinutes = commonTimeMinutes % 60;

    const [selectedHour, setSelectedHour] = useState(initialHours);
    const [selectedMinute, setSelectedMinute] = useState(initialMinutes);

    // Generate hours and minutes options
    const hours = Array.from({ length: 3 }, (_, i) => i); // 0-2 hours to keep it compact
    const minutes = [0, 15, 30, 45];

    // Update time settings whenever they change
    const updateTime = (hours: number, mins: number) => {
        setSelectedHour(hours);
        setSelectedMinute(mins);
        // Apply the time limit to all selected days immediately
        const totalMinutes = (hours * 60) + mins;
        applyToAllDays(totalMinutes);
    };

    // Quick preset buttons
    const quickPresets = [
        { minutes: 15, label: '15m' },
        { minutes: 30, label: '30m' },
        { minutes: 60, label: '1h' }
    ];

    const setQuickPreset = (totalMins: number) => {
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        updateTime(hours, mins);
    };

    const updateHour = (hour: number) => {
        updateTime(hour, selectedMinute);
    };

    const updateMinute = (minute: number) => {
        updateTime(selectedHour, minute);
    };

    return (
        <div className="flex flex-col items-center bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-md">
            {/* Compact Time Picker */}
            <div className="flex items-center justify-center space-x-1 mb-2">
                <div className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 shadow-inner">
                    {/* Hour Control */}
                    <div className="flex flex-col items-center">
                        {/* Up arrow */}
                        <button
                            type="button"
                            onClick={() => updateHour(Math.min(2, selectedHour + 1))}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour >= 2}
                            aria-label="Increase hours"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                            </svg>
                        </button>

                        {/* Hours Display */}
                        <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-bold">{selectedHour}</span>
                        </div>

                        {/* Down arrow */}
                        <button
                            type="button"
                            onClick={() => updateHour(Math.max(0, selectedHour - 1))}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour <= 0}
                            aria-label="Decrease hours"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-sm font-medium mx-1 text-neutral-800 dark:text-neutral-200">h</div>

                    {/* Minutes Control */}
                    <div className="flex flex-col items-center">
                        {/* Up arrow */}
                        <button
                            type="button"
                            onClick={() => {
                                const currentIndex = minutes.indexOf(selectedMinute);
                                if (currentIndex < minutes.length - 1) {
                                    updateMinute(minutes[currentIndex + 1]);
                                } else if (selectedHour < 2) {
                                    updateHour(selectedHour + 1);
                                    updateMinute(minutes[0]);
                                }
                            }}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour >= 2 && minutes.indexOf(selectedMinute) === minutes.length - 1}
                            aria-label="Increase minutes"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z" />
                            </svg>
                        </button>

                        {/* Minutes Display */}
                        <div className="relative w-10 h-8 flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-bold">{selectedMinute.toString().padStart(2, '0')}</span>
                        </div>

                        {/* Down arrow */}
                        <button
                            type="button"
                            onClick={() => {
                                const currentIndex = minutes.indexOf(selectedMinute);
                                if (currentIndex > 0) {
                                    updateMinute(minutes[currentIndex - 1]);
                                } else if (selectedHour > 0) {
                                    updateHour(selectedHour - 1);
                                    updateMinute(minutes[minutes.length - 1]);
                                }
                            }}
                            className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 p-1 focus:outline-none"
                            disabled={selectedHour <= 0 && selectedMinute <= 0}
                            aria-label="Decrease minutes"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-sm font-medium mx-1 text-neutral-800 dark:text-neutral-200">m</div>
                </div>
            </div>

            {/* Time display - small and compact */}
            <div className="text-center text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                {`${selectedHour}h ${selectedMinute}m daily limit`}
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
                {quickPresets.map(preset => (
                    <button
                        type="button"
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
        </div>
    );
}