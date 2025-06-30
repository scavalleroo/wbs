'use client';

import React, { useState, useEffect } from 'react';
import { ShieldBan, Download, Clock, Eye, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BlockedSite } from '@/types/report.types';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { User } from '@supabase/supabase-js';
import '@/components/notes/editor/realtime-editor.css';

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
    const [showAddSite, setShowAddSite] = useState(false);
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [newSiteDailyLimit, setNewSiteDailyLimit] = useState(5);
    const [isAddingSite, setIsAddingSite] = useState(false);

    const { getBlockedSiteStats, getBlockedSitesCount, fetchBlockedSites, updateMaxDailyVisits, removeBlockedSite, addBlockedSite } = useBlockedSite({ user });
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

    const handleVisitLimitChange = async (siteId: string, newLimit: number) => {
        if (newLimit < 0) return;

        try {
            await updateMaxDailyVisits(parseInt(siteId), newLimit);
            // Refresh the data
            const sites = await fetchBlockedSites();
            setBlockedSites(sites);
        } catch (error) {
            console.error('Failed to update visit limit:', error);
        }
    };

    const handleDeleteSite = async (siteId: string) => {
        try {
            await removeBlockedSite(parseInt(siteId));
            // Refresh the data
            const [count, sites, stats] = await Promise.all([
                getBlockedSitesCount(),
                fetchBlockedSites(),
                getBlockedSiteStats()
            ]);
            setBlockedSitesCount(count);
            setBlockedSites(sites);
            setSiteStats(stats as SiteStat[]);
        } catch (error) {
            console.error('Failed to delete site:', error);
        }
    };

    const handleAddSite = async () => {
        if (!newSiteUrl.trim() || !user) return;

        setIsAddingSite(true);
        try {
            // Clean the URL to extract domain
            let domain = newSiteUrl.trim().toLowerCase();
            // Remove protocol if present
            domain = domain.replace(/^https?:\/\//, '');
            // Remove www. if present
            domain = domain.replace(/^www\./, '');
            // Remove trailing slash and paths
            domain = domain.split('/')[0];

            await addBlockedSite(domain, newSiteDailyLimit);

            // Reset form
            setNewSiteUrl('');
            setNewSiteDailyLimit(5);
            setShowAddSite(false);

            // Refresh the data
            const [count, sites, stats] = await Promise.all([
                getBlockedSitesCount(),
                fetchBlockedSites(),
                getBlockedSiteStats()
            ]);
            setBlockedSitesCount(count);
            setBlockedSites(sites);
            setSiteStats(stats as SiteStat[]);
        } catch (error) {
            console.error('Failed to add site:', error);
        } finally {
            setIsAddingSite(false);
        }
    };

    const cancelAddSite = () => {
        setShowAddSite(false);
        setNewSiteUrl('');
        setNewSiteDailyLimit(5);
    };

    // Calculate total distraction time today
    const totalDistractionMinutes = siteStats.reduce((total, stat) => {
        return total + Math.round(stat.todayTimeSeconds / 60);
    }, 0);

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

    // Display all sites (removed expansion logic)
    const sitesToDisplay = combinedSiteData;

    if (isLoading) {
        return (
            <div className="rounded-2xl p-4 text-white relative overflow-hidden flex items-center justify-center min-h-[240px] bg-white/5 backdrop-blur-md border border-white/10 header-gradient" style={{ background: 'linear-gradient(315deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0 rounded-2xl"></div>
                <div className="relative z-10 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <p>Loading blocked sites...</p>
                </div>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="distractions-card-container rounded-2xl bg-white/5 backdrop-blur-md shadow-xl text-white relative overflow-hidden border border-white/10">
                {/* Mobile Header with reversed gradient background - same as Wellbeing but mirrored */}
                <div className="text-white p-4 pb-2 relative overflow-hidden header-gradient" style={{ background: 'linear-gradient(315deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-grow min-w-0">
                                <h2 className="font-bold text-lg flex items-center">
                                    Mindful Browsing
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-white/90">
                                        {totalDistractionMinutes > 0
                                            ? `${formatMinutesToHoursMinutes(totalDistractionMinutes)} distraction today`
                                            : "No distractions today"
                                        }
                                    </p>
                                    {!showAddSite && (
                                        <button
                                            onClick={() => setShowAddSite(true)}
                                            className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded-md transition-all duration-200 flex items-center"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Site
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Download Extension Button - Mobile Header - Match Wellbeing Update button size */}
                            <div className="flex flex-col items-end ml-2">
                                <p className="text-xs text-white/70 mb-1">chrome extension</p>
                                <button
                                    onClick={handleDownloadExtension}
                                    className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded-md transition-all duration-200 flex items-center"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to chrome
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Content area with glassmorphic background - Match Wellbeing height */}
                <div className="p-4 pt-3">
                    <div className="distractions-content-container h-48 flex flex-col">
                        {/* Description - Mobile */}
                        {blockedSitesCount === 0 && !showAddSite && (
                            <div className="mb-3">
                                <p className="text-xs text-white/70 leading-relaxed text-center">
                                    Install the Chrome extension and add distracting websites here to create mindful browsing habits with daily visit limits.
                                </p>
                            </div>
                        )}
                        {/* Add Site Form - Mobile */}
                        {showAddSite && (
                            <>
                                <div className="mb-3">
                                    {/* Top row: URL input and Daily Openings controls */}
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="text-xs text-white/70 mb-1 block">Website URL</label>
                                            <input
                                                type="text"
                                                value={newSiteUrl}
                                                onChange={(e) => setNewSiteUrl(e.target.value)}
                                                placeholder="instagram.com"
                                                className="w-full px-2 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs text-white/70 mb-1 block">Daily openings</label>
                                            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-md border border-white/20">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setNewSiteDailyLimit(Math.max(1, newSiteDailyLimit - 1))}
                                                    className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="px-2 text-xs text-white/90 min-w-[20px] text-center">
                                                    {newSiteDailyLimit}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setNewSiteDailyLimit(newSiteDailyLimit + 1)}
                                                    className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Common websites list - Mobile */}
                                    <div className="mt-2">
                                        <p className="text-xs text-white/60 mb-1">Quick add:</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['instagram.com', 'facebook.com', 'twitter.com', 'tiktok.com', 'youtube.com', 'reddit.com', 'netflix.com', 'twitch.tv', 'discord.com', 'linkedin.com'].map((site) => (
                                                <button
                                                    key={site}
                                                    onClick={() => setNewSiteUrl(site)}
                                                    className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 hover:border-white/20 px-1.5 py-0.5 rounded transition-all duration-200 truncate"
                                                >
                                                    {site.replace('.com', '')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Bottom action buttons - moved to bottom of card */}
                                <div className="mt-auto flex gap-2">
                                    <Button
                                        onClick={handleAddSite}
                                        disabled={!newSiteUrl.trim() || isAddingSite}
                                        className="h-6 text-xs bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white disabled:opacity-50 px-3"
                                    >
                                        {isAddingSite ? 'Adding...' : 'Add'}
                                    </Button>
                                    <Button
                                        onClick={cancelAddSite}
                                        className="h-6 text-xs bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-3"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Add Site Button - Mobile */}
                        {blockedSitesCount === 0 && !showAddSite && (
                            <div className="flex items-center justify-center py-6 text-center">
                                <button
                                    onClick={() => setShowAddSite(true)}
                                    className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-3 py-2 rounded-md transition-all duration-200 flex items-center"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add your first site
                                </button>
                            </div>
                        )}

                        {/* Mobile Sites List */}
                        {sitesToDisplay.length > 0 && !showAddSite ? (
                            <div className="flex-grow mb-3 overflow-y-auto">
                                <div className="grid grid-cols-3 gap-2">
                                    {sitesToDisplay.map((site) => {
                                        const timeSpentMinutes = Math.round(site.todayTimeSeconds / 60);
                                        const timeExceeded = site.timeLimitMinutes > 0 && timeSpentMinutes > site.timeLimitMinutes;
                                        const visitsExceeded = site.visitLimit > 0 && site.todayCount > site.visitLimit;
                                        const isViolatingLimits = timeExceeded || visitsExceeded;

                                        return (
                                            <div
                                                key={site.id}
                                                className={cn(
                                                    "flex flex-col text-xs p-2 rounded-lg backdrop-blur-md border transition-all duration-200",
                                                    site.accessedToday
                                                        ? isViolatingLimits
                                                            ? "bg-purple-500/20 border-purple-400/30"
                                                            : "bg-blue-500/20 border-blue-400/30"
                                                        : "bg-white/10 border-white/20"
                                                )}
                                            >
                                                {/* Site name and stats */}
                                                <div className="mb-2">
                                                    <span className="font-medium text-white text-xs truncate block">{site.name}</span>
                                                    <div className="flex flex-col gap-1 mt-1 text-xs text-white/70">
                                                        <span className="flex items-center">
                                                            <Clock className="w-2 h-2 mr-1" />
                                                            {formatMinutesToHoursMinutes(timeSpentMinutes)}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Eye className="w-2 h-2 mr-1" />
                                                            {site.todayCount} opens
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex flex-col items-center gap-1 mt-auto">
                                                    <span className="text-xs text-white/60">Daily openings</span>
                                                    <div className="flex items-center bg-white/10 backdrop-blur-md rounded-md border border-white/20">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleVisitLimitChange(site.id.toString(), (site.visitLimit || 1) - 1)}
                                                            className="h-5 w-5 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                        >
                                                            <Minus className="h-2 w-2" />
                                                        </Button>
                                                        <span className="px-1 text-xs text-white/90 min-w-[15px] text-center">
                                                            {site.visitLimit || 0}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleVisitLimitChange(site.id.toString(), (site.visitLimit || 0) + 1)}
                                                            className="h-5 w-5 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                        >
                                                            <Plus className="h-2 w-2" />
                                                        </Button>
                                                    </div>
                                                    {/* Delete button */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteSite(site.id.toString())}
                                                        className="h-5 w-5 p-0 text-white/70 hover:text-white hover:bg-white/20 bg-white/10 backdrop-blur-md border border-white/20 rounded-md mt-1"
                                                    >
                                                        <Trash2 className="h-2 w-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="distractions-card-container rounded-2xl bg-white/5 backdrop-blur-md shadow-xl text-white relative overflow-hidden border border-white/10">
            {/* Header with reversed gradient background - same as Wellbeing but mirrored */}
            <div className="text-white p-4 pb-2 relative overflow-hidden header-gradient" style={{ background: 'linear-gradient(315deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow min-w-0">
                            <h2 className="font-bold text-xl flex items-center">
                                Mindful Browsing
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <p className="text-base text-white/90">
                                    {totalDistractionMinutes > 0
                                        ? `${formatMinutesToHoursMinutes(totalDistractionMinutes)} distraction today`
                                        : "No distractions today"
                                    }
                                </p>
                                {!showAddSite && (
                                    <button
                                        onClick={() => setShowAddSite(true)}
                                        className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-all duration-200 flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Site
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Download Extension Button - Match Wellbeing Update button size */}
                        <div className="flex flex-col items-end">
                            <p className="text-xs text-white/70 mb-1">BROWSER EXTENSION</p>
                            <button
                                onClick={handleDownloadExtension}
                                className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-all duration-200 flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Browser
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area with glassmorphic background - Match Wellbeing height */}
            <div className="p-6 pt-4">
                <div className="distractions-content-container h-56 flex flex-col">
                    {/* Description - Desktop */}
                    {blockedSitesCount === 0 && !showAddSite && (
                        <div className="mb-4">
                            <p className="text-sm text-white/70 leading-relaxed text-center">
                                Install the Chrome extension and add distracting websites here to create mindful browsing habits with daily visit limits.
                            </p>
                        </div>
                    )}
                    {/* Add Site Form - Desktop */}
                    {showAddSite && (
                        <>
                            <div className="mb-4">
                                {/* Top row: URL input and Daily Openings controls */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-sm text-white/70 mb-2 block">Website URL</label>
                                        <input
                                            type="text"
                                            value={newSiteUrl}
                                            onChange={(e) => setNewSiteUrl(e.target.value)}
                                            placeholder="instagram.com"
                                            className="w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-sm text-white/70 mb-2 block">Daily openings</label>
                                        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setNewSiteDailyLimit(Math.max(1, newSiteDailyLimit - 1))}
                                                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-l-lg rounded-r-none"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="px-2 text-sm text-white/90 min-w-[30px] text-center border-x border-white/20">
                                                {newSiteDailyLimit}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setNewSiteDailyLimit(newSiteDailyLimit + 1)}
                                                className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-r-lg rounded-l-none"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Common websites list - Desktop */}
                                <div className="mt-2">
                                    <p className="text-sm text-white/60 mb-1">Quick add:</p>
                                    <div className="grid grid-cols-5 gap-1">
                                        {['instagram.com', 'facebook.com', 'twitter.com', 'tiktok.com', 'youtube.com', 'reddit.com', 'netflix.com', 'twitch.tv', 'discord.com', 'linkedin.com'].map((site) => (
                                            <button
                                                key={site}
                                                onClick={() => setNewSiteUrl(site)}
                                                className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 hover:border-white/20 px-2 py-1 rounded transition-all duration-200 truncate"
                                            >
                                                {site.replace('.com', '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Bottom action buttons - moved to bottom of card */}
                            <div className="mt-auto flex gap-3">
                                <Button
                                    onClick={handleAddSite}
                                    disabled={!newSiteUrl.trim() || isAddingSite}
                                    className="px-4 py-2 text-sm bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white disabled:opacity-50 rounded-lg"
                                >
                                    {isAddingSite ? 'Adding...' : 'Add'}
                                </Button>
                                <Button
                                    onClick={cancelAddSite}
                                    className="px-4 py-2 text-sm bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Add Site Button - Desktop */}
                    {blockedSitesCount === 0 && !showAddSite && (
                        <div className="flex items-center justify-center py-12 text-center">
                            <button
                                onClick={() => setShowAddSite(true)}
                                className="text-sm text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add your first site
                            </button>
                        </div>
                    )}

                    {/* Sites Grid - 3 columns for desktop */}
                    {sitesToDisplay.length > 0 && !showAddSite ? (
                        <div className="flex-grow mb-4 overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3">
                                {sitesToDisplay.map((site) => {
                                    const timeSpentMinutes = Math.round(site.todayTimeSeconds / 60);
                                    const timeExceeded = site.timeLimitMinutes > 0 && timeSpentMinutes > site.timeLimitMinutes;
                                    const visitsExceeded = site.visitLimit > 0 && site.todayCount > site.visitLimit;
                                    const isViolatingLimits = timeExceeded || visitsExceeded;

                                    return (
                                        <div
                                            key={site.id}
                                            className={cn(
                                                "flex flex-col text-sm p-3 rounded-lg backdrop-blur-md border transition-all duration-200 min-h-[120px]",
                                                site.accessedToday
                                                    ? isViolatingLimits
                                                        ? "bg-purple-500/20 border-purple-400/30"
                                                        : "bg-blue-500/20 border-blue-400/30"
                                                    : "bg-white/10 border-white/20"
                                            )}
                                        >
                                            {/* Site name and stats */}
                                            <div className="flex-1 min-w-0 mb-3">
                                                <span className="font-medium truncate block text-white text-sm">{site.name}</span>
                                                <div className="space-y-1 mt-2">
                                                    <div className="flex items-center text-xs text-white/70">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        <span className="truncate">{formatMinutesToHoursMinutes(timeSpentMinutes)}</span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-white/70">
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        <span className="truncate">{site.todayCount} opens</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Controls - stacked vertically */}
                                            <div className="flex flex-col space-y-2">
                                                {/* Visit limit controls */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-white/60">Daily</span>
                                                    <div className="flex items-center bg-white/10 backdrop-blur-md rounded border border-white/20">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleVisitLimitChange(site.id.toString(), (site.visitLimit || 1) - 1)}
                                                            className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                        >
                                                            <Minus className="h-2.5 w-2.5" />
                                                        </Button>
                                                        <span className="px-1.5 text-xs text-white/90 min-w-[20px] text-center">
                                                            {site.visitLimit || 0}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleVisitLimitChange(site.id.toString(), (site.visitLimit || 0) + 1)}
                                                            className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                                                        >
                                                            <Plus className="h-2.5 w-2.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {/* Delete button */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteSite(site.id.toString())}
                                                    className="h-6 w-full p-0 text-white/70 hover:text-white hover:bg-white/20 bg-white/10 backdrop-blur-md border border-white/20 rounded text-xs"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}