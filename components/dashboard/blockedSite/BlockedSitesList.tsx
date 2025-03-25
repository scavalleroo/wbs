import React from 'react';
import { BlockedSite } from '@/types/report.types';
import { BlockedSiteCard } from './BlockedSiteCard';
import { Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockedSitesListProps {
    loading: boolean;
    blockedSites: BlockedSite[];
    siteStats: any[];
    searchQuery: string;
    setActiveTab: (tab: 'add' | 'current') => void;
    showTimeControls: Record<number, boolean>;
    editingSiteId: number | null;
    currentSiteWeekdayLimits: any;
    toggleTimeControls: (id: number, site: BlockedSite) => void;
    handleRemoveSite: (id: number) => Promise<void>;
    toggleSiteDay: (siteId: number, day: string, currentEnabled: boolean) => Promise<void>;
    setSiteTimeLimit: (siteId: number, day: string, minutes: number) => Promise<void>;
    handleUpdateLimit: (id: number, maxVisits: number) => Promise<boolean>; // Change return type to boolean
    getTodayUsage: (site: BlockedSite, stats: any[]) => { visits: number; timeMinutes: number };
    getTodayLimit: (site: BlockedSite) => { enabled: boolean; minutes: number };
    getSiteBrandColor: (domain: string) => { bg: string; text: string };
}

// IMPORTANT: Modify the rendering condition to NOT show loader for time updates
export function BlockedSitesList({
    loading,
    blockedSites,
    siteStats,
    searchQuery,
    setActiveTab,
    showTimeControls,
    editingSiteId,
    currentSiteWeekdayLimits,
    toggleTimeControls,
    handleRemoveSite,
    toggleSiteDay,
    setSiteTimeLimit,
    handleUpdateLimit,
    getTodayUsage,
    getTodayLimit,
    getSiteBrandColor
}: BlockedSitesListProps) {
    // Only show loader for initial load, not for updates
    if (loading && blockedSites.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (blockedSites.length === 0) {
        return (
            <div className="text-center py-10">
                <Ban className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600" />
                <p className="mt-4 text-neutral-500">No blocked sites yet</p>
                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setActiveTab('add')}
                >
                    Add your first blocked site
                </Button>
            </div>
        );
    }

    // Rest of the component remains the same
    return (
        <div className="space-y-4">
            {blockedSites
                .filter(site => site.domain.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((site) => (
                    <BlockedSiteCard
                        key={site.id}
                        site={site}
                        siteStats={siteStats}
                        showTimeControls={showTimeControls}
                        editingSiteId={editingSiteId}
                        currentSiteWeekdayLimits={currentSiteWeekdayLimits}
                        toggleTimeControls={toggleTimeControls}
                        handleRemoveSite={handleRemoveSite}
                        toggleSiteDay={toggleSiteDay}
                        setSiteTimeLimit={setSiteTimeLimit}
                        handleUpdateLimit={handleUpdateLimit}
                        getTodayUsage={getTodayUsage}
                        getTodayLimit={getTodayLimit}
                        getSiteBrandColor={getSiteBrandColor}
                    />
                ))}
        </div>
    );
}