'use client';

import React, { useState } from 'react';
import { ShieldBan, Download, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BlockedSite } from '@/types/report.types';

interface SiteStat {
    domain: string;
    todayCount: number; // Visits today
    todayTimeSeconds: number; // Time spent today
    // Add other potential fields if available from getBlockedSiteStats
}

interface OptimizedDistractionsCardProps {
    isLoading: boolean;
    blockedSites: BlockedSite[]; // List of all blocked sites with their limits
    siteStats: SiteStat[]; // Stats for sites visited today
    blockedSitesCount: number;
    onManageDistractionsClick: () => void;
    formatMinutesToHoursMinutes: (minutes: number) => string;
}

// Helper to get today's day key (e.g., 'monday', 'tuesday')
const getTodayKey = (): keyof BlockedSite => {
    const dayNames: (keyof BlockedSite)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return dayNames[new Date().getDay()];
};

export function OptimizedDistractionsCard({
    isLoading,
    blockedSites,
    siteStats,
    blockedSitesCount,
    onManageDistractionsClick,
    formatMinutesToHoursMinutes
}: OptimizedDistractionsCardProps) {
    const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDownloadExtension = () => {
        window.open(`https://chrome.google.com/webstore/detail/${extensionId}`, '_blank');
    };

    // Combine blocked sites with their stats
    const combinedSiteData = blockedSites.map(site => {
        const stats = siteStats.find(stat => stat.domain === site.domain);
        const todayKey = getTodayKey();
        const isEnabledToday = site[`${todayKey}_enabled`] ?? true; // Default to enabled if not set? Check your logic
        const timeLimitMinutes = isEnabledToday ? (site[`${todayKey}_time_limit_minutes`] ?? 0) : 0; // Use 0 if disabled
        const visitLimit = site.max_daily_visits ?? 0; // Use 0 if not set

        return {
            id: site.id,
            domain: site.domain,
            name: site.domain.split('.')[0].charAt(0).toUpperCase() + site.domain.split('.')[0].slice(1), // Simple name
            todayTimeSeconds: stats?.todayTimeSeconds ?? 0,
            todayCount: stats?.todayCount ?? 0,
            timeLimitMinutes: timeLimitMinutes,
            visitLimit: visitLimit,
            accessedToday: (stats?.todayTimeSeconds ?? 0) > 0 || (stats?.todayCount ?? 0) > 0 // Flag if accessed
        };
    });

    // Sort the combined data: time spent (desc), then visits (desc)
    combinedSiteData.sort((a, b) => {
        if (b.todayTimeSeconds !== a.todayTimeSeconds) {
            return b.todayTimeSeconds - a.todayTimeSeconds;
        }
        return b.todayCount - a.todayCount;
    });

    // Determine which sites to display based on expansion state
    const sitesToDisplay = isExpanded ? combinedSiteData : combinedSiteData.slice(0, 4);
    const canExpand = combinedSiteData.length > 4;

    return (
        <div className="rounded-xl p-4 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 shadow-[0_0_12px_rgba(239,68,68,0.4)] text-white relative overflow-hidden h-full flex flex-col">
            {/* Decorative elements */}
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>

            <div className="relative z-10 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold flex items-center">
                        <ShieldBan className="mr-1.5 h-4 w-4" />
                        Distractions
                    </h2>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                        {blockedSitesCount} sites blocked
                    </span>
                </div>

                {/* Distraction Grid */}
                <div className="flex-grow mb-2 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center text-white/70 text-sm py-4">Loading stats...</div>
                    ) : sitesToDisplay.length > 0 ? (
                        sitesToDisplay.map((site) => {
                            const timeSpentMinutes = Math.round(site.todayTimeSeconds / 60);
                            const timeLimitDisplay = site.timeLimitMinutes > 0 ? formatMinutesToHoursMinutes(site.timeLimitMinutes) : '∞'; // Show infinity if limit is 0
                            const visitLimitDisplay = site.visitLimit > 0 ? site.visitLimit : '∞'; // Show infinity if limit is 0

                            // Determine text color based on exceeding limits
                            const timeExceeded = site.timeLimitMinutes > 0 && timeSpentMinutes > site.timeLimitMinutes;
                            const visitsExceeded = site.visitLimit > 0 && site.todayCount > site.visitLimit;
                            const exceededClass = timeExceeded || visitsExceeded ? 'text-red-300' : 'text-white/80';

                            // Conditional background based on access today
                            const backgroundClass = site.accessedToday ? 'bg-amber-900/30' : 'bg-white/10'; // Warning background if accessed

                            return (
                                <div key={site.id} className={cn("flex items-center justify-between text-sm p-2 rounded transition-colors duration-200", backgroundClass)}>
                                    {/* Site Name */}
                                    <span className="font-medium truncate mr-2 flex-shrink min-w-0">{site.name}</span>

                                    {/* Stats (Time and Visits) */}
                                    <div className={cn("flex items-center space-x-3 text-xs flex-shrink-0", exceededClass)}>
                                        {/* Time Spent vs Limit */}
                                        <span className="flex items-center" title={`Time spent today vs limit (${timeLimitDisplay})`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatMinutesToHoursMinutes(timeSpentMinutes)}
                                            {site.timeLimitMinutes > 0 && <span className="ml-0.5 text-white/60">/ {timeLimitDisplay}</span>}
                                        </span>
                                        {/* Visits vs Limit */}
                                        <span className="flex items-center" title={`Visits today vs limit (${visitLimitDisplay})`}>
                                            <Eye className="w-3 h-3 mr-1" />
                                            {site.todayCount}
                                            {site.visitLimit > 0 && <span className="ml-0.5 text-white/60">/ {visitLimitDisplay}</span>}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-white/70 text-sm py-4">No sites are currently blocked.</div>
                    )}
                </div>

                {/* Show More/Less Button */}
                {canExpand && (
                    <div className="text-center mt-1 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-6 px-2"
                        >
                            {isExpanded ? 'Show Less' : 'Show More'}
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto flex gap-2 flex-col sm:flex-row pt-2">
                    <Button
                        onClick={onManageDistractionsClick}
                        className="flex-1 flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                    >
                        <ShieldBan className="h-4 w-4 mr-1.5" />
                        Manage
                    </Button>
                    <Button
                        onClick={handleDownloadExtension}
                        className="flex-1 flex items-center justify-center py-2 bg-white/20 hover:bg-white/30 border-none text-white font-medium"
                    >
                        <Download className="h-4 w-4 mr-1.5" />
                        Extension
                    </Button>
                </div>
            </div>
        </div>
    );
}