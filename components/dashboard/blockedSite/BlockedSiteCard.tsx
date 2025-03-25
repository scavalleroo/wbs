import React from 'react';
import { BlockedSite, WeekdayLimits } from '@/types/report.types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialIcon } from 'react-social-icons';
import { Clock, Trash2, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SiteTimeControls } from './SiteTimeControls';

interface BlockedSiteCardProps {
    site: BlockedSite;
    siteStats: any[];
    showTimeControls: Record<number, boolean>;
    editingSiteId: number | null;
    currentSiteWeekdayLimits: WeekdayLimits;
    toggleTimeControls: (id: number, site: BlockedSite) => void;
    handleRemoveSite: (id: number) => Promise<void>;
    toggleSiteDay: (siteId: number, day: string, currentEnabled: boolean) => Promise<void>;
    setSiteTimeLimit: (siteId: number, day: string, minutes: number) => Promise<void>;
    handleUpdateLimit: (id: number, maxVisits: number) => Promise<boolean>; // Change return type to boolean
    getTodayUsage: (site: BlockedSite, stats: any[]) => { visits: number; timeMinutes: number };
    getTodayLimit: (site: BlockedSite) => { enabled: boolean; minutes: number };
    getSiteBrandColor: (domain: string) => { bg: string; text: string };
}

export function BlockedSiteCard({
    site,
    siteStats,
    showTimeControls,
    editingSiteId,
    currentSiteWeekdayLimits,
    toggleTimeControls,
    handleRemoveSite,
    toggleSiteDay,
    setSiteTimeLimit,
    handleUpdateLimit, // Add this to the props destructuring
    getTodayUsage,
    getTodayLimit,
    getSiteBrandColor
}: BlockedSiteCardProps) {
    // Rest of the component remains unchanged
    const usage = getTodayUsage(site, siteStats);
    const todayLimit = getTodayLimit(site);
    const todayVisits = usage.visits;
    const maxVisits = site.max_daily_visits || 3;
    const todayTimeMinutes = usage.timeMinutes;

    // Calculate usage percentages for progress bars
    const visitsPercent = Math.min(100, (todayVisits / maxVisits) * 100);
    const timePercent = todayLimit.enabled && todayLimit.minutes > 0 ?
        Math.min(100, (todayTimeMinutes / todayLimit.minutes) * 100) : 0;

    // Get brand colors
    const brandColor = getSiteBrandColor(site.domain);
    const siteName = site.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
    const isGradient = brandColor.bg.startsWith('bg-');

    return (
        <Card className="overflow-hidden border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
            {/* Usage progress indicators */}
            <UsageProgressBar
                visitsPercent={visitsPercent}
                timePercent={timePercent}
                todayVisits={todayVisits}
                maxVisits={maxVisits}
                todayTimeMinutes={todayTimeMinutes}
                todayLimit={todayLimit}
            />

            <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Domain and stats */}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center">
                            {/* Brand-colored icon background */}
                            <div
                                className={`flex items-center justify-center h-9 w-9 rounded-md mr-2.5 ${isGradient ? brandColor.bg : ''}`}
                                style={!isGradient ? { backgroundColor: brandColor.bg, color: brandColor.text } : {}}
                            >
                                <SocialIcon
                                    network={siteName}
                                    style={{ height: 24, width: 24 }}
                                    fgColor={isGradient ? "white" : brandColor.text}
                                    bgColor="transparent"
                                />
                            </div>
                            <div className="flex-grow min-w-0">
                                <span className="font-medium text-sm truncate block">{site.domain}</span>

                                {/* Stats badges */}
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                    <UsageStatsBadges
                                        todayVisits={todayVisits}
                                        maxVisits={maxVisits}
                                        todayTimeMinutes={todayTimeMinutes}
                                        todayLimit={todayLimit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0 ml-auto">
                        {/* Time settings toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full ${showTimeControls[site.id] ?
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                'text-neutral-600 dark:text-neutral-300'
                                }`}
                            onClick={() => toggleTimeControls(site.id, site)}
                            title="Time limits"
                        >
                            <Clock className="h-4 w-4" />
                        </Button>

                        {/* Delete button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSite(site.id)}
                            className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Remove site"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Expanded controls */}
                {showTimeControls[site.id] && editingSiteId === site.id && (
                    <SiteTimeControls
                        site={site}
                        currentSiteWeekdayLimits={currentSiteWeekdayLimits}
                        toggleSiteDay={toggleSiteDay}
                        setSiteTimeLimit={setSiteTimeLimit}
                        handleUpdateLimit={handleUpdateLimit}
                    />
                )}
            </CardContent>
        </Card>
    );
}

// Helper components remain unchanged

// Helper components
function UsageProgressBar({ visitsPercent, timePercent, todayVisits, maxVisits, todayTimeMinutes, todayLimit }: any) {
    return (
        <div className="h-1.5 flex w-full">
            <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-700">
                <div
                    className={`h-full transition-all duration-300 ${todayVisits === 0 ? "bg-emerald-500" :
                        todayVisits >= maxVisits ? "bg-rose-500" :
                            "bg-amber-500"
                        }`}
                    style={{ width: `${visitsPercent}%` }}
                />
            </div>

            {todayLimit.enabled && todayLimit.minutes > 0 && (
                <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-700">
                    <div
                        className={`h-full transition-all duration-300 ${todayTimeMinutes === 0 ? "bg-emerald-500" :
                            todayTimeMinutes >= todayLimit.minutes ? "bg-rose-500" :
                                "bg-blue-500"
                            }`}
                        style={{ width: `${timePercent}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function UsageStatsBadges({ todayVisits, maxVisits, todayTimeMinutes, todayLimit }: any) {
    return (
        <>
            {/* Visits badge */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center px-1.5 py-0.5 rounded-full bg-opacity-10 border max-w-full overflow-hidden"
                            style={{
                                backgroundColor: `${todayVisits === 0 ? 'rgba(16, 185, 129, 0.1)' :
                                    todayVisits >= maxVisits ? 'rgba(239, 68, 68, 0.1)' :
                                        'rgba(245, 158, 11, 0.1)'}`,
                                borderColor: `${todayVisits === 0 ? 'rgba(16, 185, 129, 0.2)' :
                                    todayVisits >= maxVisits ? 'rgba(239, 68, 68, 0.2)' :
                                        'rgba(245, 158, 11, 0.2)'}`
                            }}
                        >
                            <span className={`font-medium ${todayVisits === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                todayVisits >= maxVisits ? 'text-rose-600 dark:text-rose-400' :
                                    'text-amber-600 dark:text-amber-400'
                                }`}>{todayVisits}</span>
                            <span className="mx-1 opacity-50">/</span>
                            <span className="opacity-70">{maxVisits}</span>
                            <span className="ml-1 opacity-70 truncate">visits</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Number of visits today / Daily limit</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Time badge - similar updates */}
            {todayLimit.enabled && todayLimit.minutes > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center px-1.5 py-0.5 rounded-full bg-opacity-10 border max-w-full overflow-hidden"
                                style={{
                                    backgroundColor: `${todayTimeMinutes === 0 ? 'rgba(16, 185, 129, 0.1)' :
                                        todayTimeMinutes >= todayLimit.minutes ? 'rgba(239, 68, 68, 0.1)' :
                                            'rgba(59, 130, 246, 0.1)'}`,
                                    borderColor: `${todayTimeMinutes === 0 ? 'rgba(16, 185, 129, 0.2)' :
                                        todayTimeMinutes >= todayLimit.minutes ? 'rgba(239, 68, 68, 0.2)' :
                                            'rgba(59, 130, 246, 0.2)'}`
                                }}
                            >
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className={`font-medium ${todayTimeMinutes === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                                    todayTimeMinutes >= todayLimit.minutes ? 'text-rose-600 dark:text-rose-400' :
                                        'text-blue-600 dark:text-blue-400'
                                    }`}>{todayTimeMinutes}m</span>
                                <span className="mx-1 opacity-50">/</span>
                                <span className="opacity-70">{todayLimit.minutes}m</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Time spent today / Daily time limit</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </>
    );
}