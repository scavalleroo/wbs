import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { z } from 'zod';
import { mostPopularDomains } from '@/utils/constants';
import { BlockedSitesList } from './BlockSitesList';
import { AddDomainCollapsible } from './AddDomainCollapsible';
import { useBlockedSite } from '@/hooks/use-blocked-site';

interface ExtensionTabProps {
    user: User | null | undefined;
}

interface BypassAttempt {
    domain: string;
    bypassed: boolean;
    created_at: string;
}

interface BypassData {
    date: string;
    count: number;
    domain?: string;
}

const domainSchema = z.string()
    .min(3, { message: "Domain must be at least 3 characters" })
    .refine(domain => {
        // Basic domain validation (imperfect but catches obvious issues)
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        return domainRegex.test(domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]);
    }, { message: "Please enter a valid domain (e.g., example.com)" });

export function ExtensionTab({
    user
}: ExtensionTabProps) {
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState('');
    const [timeRange, setTimeRange] = useState('week');
    const [bypassData, setBypassData] = useState<BypassData[]>([]);
    const [bypassByDomain, setBypassByDomain] = useState<BypassData[]>([]);
    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const {
        blockedSites,
        loading,
        fetchBlockedSites,
        addBlockedSite,
        removeBlockedSite,
        getBlockedSiteStats,
        updateMaxDailyVisits,
        getBypassAttempts
    } = useBlockedSite({ user });
    const [stats, setStats] = useState<Array<{
        domain: string;
        count: number;
        todayCount: number;
        bypassedCount: number;
        lastAttempt: string;
        maxDailyVisits?: number;
        streakCount?: number;
    }>>([]);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            const siteStats = await getBlockedSiteStats();
            setStats(siteStats as any[]);

            // Load bypass data for chart
            await loadBypassData(timeRange);
        };

        loadData();
    }, [fetchBlockedSites, getBlockedSiteStats]);

    // Load bypass data for charts
    const loadBypassData = async (range: string) => {
        let days;

        switch (range) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'year':
                days = 365;
                break;
            default:
                days = 7;
        }

        // Get bypass attempts data
        const bypassAttempts = await getBypassAttempts(days);

        // Format data for time-series chart
        const dateRange = eachDayOfInterval({
            start: subDays(new Date(), days - 1),
            end: new Date()
        });

        const formattedData = dateRange.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = bypassAttempts.filter(
                (attempt: BypassAttempt) => format(new Date(attempt.created_at), 'yyyy-MM-dd') === dateStr && attempt.bypassed
            );

            return {
                date: format(date, 'MMM dd'),
                count: dayData.length
            };
        });

        setBypassData(formattedData);

        // Format data for domain breakdown chart
        const domainData = blockedSites.map(site => {
            const siteBypassCount = bypassAttempts.filter(
                (attempt: { domain: string; bypassed: boolean; created_at: string }) =>
                    attempt.domain === site.domain && attempt.bypassed
            ).length;

            return {
                date: site.created_at,
                domain: site.domain,
                count: siteBypassCount
            };
        }).sort((a, b) => b.count - a.count);

        setBypassByDomain(domainData);
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate domain
            domainSchema.parse(newDomain);
            setDomainError('');

            // Add domain to blocked list with default max_daily_visits of 3
            const result = await addBlockedSite(newDomain, 3);
            if (result) {
                // Refresh stats
                const siteStats = await getBlockedSiteStats();
                setStats(siteStats as any[]);
                setNewDomain('');
                setIsAddingDomain(false);

                // Refresh chart data
                await loadBypassData(timeRange);
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                setDomainError(err.errors[0].message);
            } else {
                toast.error('Failed to add domain');
            }
        }
    };

    const handleRemoveDomain = async (id: number) => {
        const success = await removeBlockedSite(id);
        if (success) {
            // Refresh stats
            const siteStats = await getBlockedSiteStats();
            setStats(siteStats as any[]);

            // Refresh chart data
            await loadBypassData(timeRange);
        }
    };

    const handleUpdateLimit = async (id: number, currentLimit: number, increment: boolean) => {
        const newLimit = increment ? currentLimit + 1 : Math.max(0, currentLimit - 1);
        const success = await updateMaxDailyVisits(id, newLimit);
        if (success) {
            // Refresh stats
            const siteStats = await getBlockedSiteStats();
            setStats(siteStats as any[]);
        }
    };

    const refreshStats = async () => {
        const siteStats = await getBlockedSiteStats();
        setStats(siteStats as any[]);
        await loadBypassData(timeRange);
    };

    // Calculate the total number of bypassed attempts for the selected time range
    const totalBypassCount = bypassData.reduce((sum, day) => sum + day.count, 0);

    return (
        <div className="pt-4 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm text-blue-600 dark:text-blue-400">Blocked Sites</h4>
                    <p className="text-2xl font-bold">{blockedSites.length}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <h4 className="text-sm text-amber-600 dark:text-amber-400">Bypass Events</h4>
                    <p className="text-2xl font-bold">{totalBypassCount}</p>
                </div>
            </div>

            {/* Add new domain button/form */}
            <AddDomainCollapsible
                isAddingDomain={isAddingDomain}
                setIsAddingDomain={setIsAddingDomain}
                newDomain={newDomain}
                setNewDomain={setNewDomain}
                domainError={domainError}
                loading={loading}
                blockedSites={blockedSites}
                mostPopularDomains={mostPopularDomains}
                handleAddDomain={handleAddDomain}
                addBlockedSite={addBlockedSite}
                refreshStats={refreshStats}
            />

            {/* Blocked Sites List */}
            <BlockedSitesList
                loading={loading}
                blockedSites={blockedSites}
                stats={stats}
                onUpdateLimit={handleUpdateLimit}
                onRemoveDomain={handleRemoveDomain}
                onAddSite={() => setIsAddingDomain(true)}
            />
        </div>
    );
}