'use client';

import React, { useState, useEffect } from 'react';
import { ShieldBan, Download, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BlockedSite } from '@/types/report.types';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { User } from '@supabase/supabase-js';

interface SiteStat {
    domain: string;
    todayCount: number;
    todayTimeSeconds: number;
}

interface OptimizedDistractionsCardProps {
    user: User | null | undefined;
    onManageDistractionsClick: () => void;
    formatMinutesToHoursMinutes: (minutes: number) => string;
    isMobile?: boolean;
}

// Helper to get today's day key (e.g., 'monday', 'tuesday')
const getTodayKey = (): keyof BlockedSite => {
    const dayNames: (keyof BlockedSite)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return dayNames[new Date().getDay()];
};

export function OptimizedDistractionsCard({
    user,
    onManageDistractionsClick,
    formatMinutesToHoursMinutes,
    isMobile = false
}: OptimizedDistractionsCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
    const [siteStats, setSiteStats] = useState<SiteStat[]>([]);
    const [blockedSitesCount, setBlockedSitesCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const { getBlockedSiteStats, getBlockedSitesCount, fetchBlockedSites } = useBlockedSite({ user });
    const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;

    useEffect(() => {
        const loadDistractionsData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [count, sites, stats] = await Promise.all([
                    getBlockedSitesCount(),
                    fetchBlockedSites(),
                    getBlockedSiteStats()
                ]);
                setBlockedSitesCount(count);
                setBlockedSites(sites);
                setSiteStats(stats as SiteStat[]);
            } catch (error) {
                console.error("Failed to load distractions data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDistractionsData();
    }, [user, fetchBlockedSites, getBlockedSitesCount, getBlockedSiteStats]);

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

    if (isLoading) {
        return (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 text-white flex items-center justify-center min-h-[240px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Loading your blocked sites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 shadow-xl text-white relative overflow-hidden flex flex-col">
            {/* Decorative elements */}
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-white/5 z-0"></div>
            <div className="absolute inset-0 bg-black/10 z-0"></div>

            <div className="relative z-10 flex flex-col flex-grow">
                {/* Header with better explanation */}
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="font-bold text-lg flex items-center">
                                <ShieldBan className="mr-2 h-5 w-5" />
                                Website Blocker
                            </h2>
                            <p className="text-sm text-white/80">
                                {blockedSitesCount > 0
                                    ? `${blockedSitesCount} sites blocked to help you focus`
                                    : "Block distracting websites during focus time"
                                }
                            </p>
                        </div>
                    </div>

                    {blockedSitesCount === 0 && (
                        <div className="bg-white/10 rounded-lg p-3 mb-4">
                            <p className="text-sm text-white/90 mb-2">
                                📱 Get started in 2 easy steps:
                            </p>
                            <ol className="text-xs text-white/80 space-y-1 list-decimal list-inside">
                                <li>Install our Chrome extension</li>
                                <li>Add websites you want to block</li>
                            </ol>
                        </div>
                    )}
                </div>

                {/* Sites List */}
                {sitesToDisplay.length > 0 ? (
                    <div className="flex-grow mb-4 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                        {sitesToDisplay.map((site) => {
                            const timeSpentMinutes = Math.round(site.todayTimeSeconds / 60);
                            const timeLimitDisplay = site.timeLimitMinutes > 0 ? formatMinutesToHoursMinutes(site.timeLimitMinutes) : '∞';
                            const visitLimitDisplay = site.visitLimit > 0 ? site.visitLimit : '∞';

                            const timeExceeded = site.timeLimitMinutes > 0 && timeSpentMinutes > site.timeLimitMinutes;
                            const visitsExceeded = site.visitLimit > 0 && site.todayCount > site.visitLimit;
                            const isViolatingLimits = timeExceeded || visitsExceeded;

                            return (
                                <div
                                    key={site.id}
                                    className={cn(
                                        "flex items-center justify-between text-sm px-3 py-2 rounded-lg transition-all duration-200",
                                        site.accessedToday
                                            ? isViolatingLimits
                                                ? "bg-red-500/20 border border-red-400/30"
                                                : "bg-amber-500/20"
                                            : "bg-white/10"
                                    )}
                                >
                                    {/* Site Name and Status */}
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium truncate block">{site.name}</span>
                                            {site.accessedToday && (
                                                <span className={cn(
                                                    "text-xs",
                                                    isViolatingLimits ? "text-red-200" : "text-amber-200"
                                                )}>
                                                    {isViolatingLimits ? "⚠️ Limit exceeded" : "📍 Accessed today"}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Usage Stats */}
                                    <div className="flex items-center space-x-3 text-xs flex-shrink-0 ml-2">
                                        <div className="text-center" title={`Time spent today vs limit (${timeLimitDisplay})`}>
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span className={cn(timeExceeded && "text-red-200 font-bold")}>
                                                    {formatMinutesToHoursMinutes(timeSpentMinutes)}
                                                </span>
                                            </div>
                                            {site.timeLimitMinutes > 0 && (
                                                <div className="text-white/60">/ {timeLimitDisplay}</div>
                                            )}
                                        </div>

                                        <div className="text-center" title={`Visits today vs limit (${visitLimitDisplay})`}>
                                            <div className="flex items-center">
                                                <Eye className="w-3 h-3 mr-1" />
                                                <span className={cn(visitsExceeded && "text-red-200 font-bold")}>
                                                    {site.todayCount}
                                                </span>
                                            </div>
                                            {site.visitLimit > 0 && (
                                                <div className="text-white/60">/ {visitLimitDisplay}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center py-8">
                        <div>
                            <ShieldBan className="h-12 w-12 mx-auto mb-3 text-white/50" />
                            <p className="text-white/70 text-sm mb-2">No blocked sites yet</p>
                            <p className="text-white/60 text-xs">
                                Add websites that distract you from your goals
                            </p>
                        </div>
                    </div>
                )}

                {/* Show More/Less Button */}
                {canExpand && (
                    <div className="text-center mb-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-white/70 hover:text-white hover:bg-white/10 text-xs h-7 px-3 rounded-lg"
                        >
                            {isExpanded ? 'Show Less' : `Show ${combinedSiteData.length - 4} More`}
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={onManageDistractionsClick}
                            className="flex items-center justify-center h-10 bg-white/20 hover:bg-white/30 border-none text-white font-medium rounded-lg transition-all duration-200"
                        >
                            <ShieldBan className="h-4 w-4 mr-2" />
                            {blockedSitesCount > 0 ? 'Manage Sites' : 'Add Sites'}
                        </Button>
                        <Button
                            onClick={handleDownloadExtension}
                            className="flex items-center justify-center h-10 bg-white/20 hover:bg-white/30 border-none text-white font-medium rounded-lg transition-all duration-200"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Extension
                        </Button>
                    </div>
                    <p className="text-xs text-center text-white/60">
                        💡 Block social media, news sites, or any distracting websites
                    </p>
                </div>
            </div>
        </div>
    );
}