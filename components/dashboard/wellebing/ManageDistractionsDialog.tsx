import React, { useState, useEffect } from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, X } from "lucide-react";
import { toast } from 'sonner';
import { useBlockedSite } from "@/hooks/use-blocked-site";
import { UserIdParam } from '@/types/types';
import { BlockedSite } from '@/types/report.types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlockedSitesList } from '../blockedSite/BlockedSitesList';
import { AddNewSiteForm } from '../blockedSite/AddNewSiteForm';

interface ManageDistractionsDialogProps extends UserIdParam {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    blockedSitesCount: number;
    onBlockedSitesUpdated: () => Promise<void>;
}

interface PopularSite {
    name: string;
    domain: string;
}

interface DayTimeLimit {
    enabled: boolean;
    minutes: number;
}

type WeekdayLimits = {
    [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: DayTimeLimit
}

const popularSites: PopularSite[] = [
    { name: 'Facebook', domain: 'facebook.com' },
    { name: 'Instagram', domain: 'instagram.com' },
    { name: 'Twitter', domain: 'twitter.com' },
    { name: 'TikTok', domain: 'tiktok.com' },
    { name: 'YouTube', domain: 'youtube.com' },
    { name: 'Reddit', domain: 'reddit.com' },
    { name: 'LinkedIn', domain: 'linkedin.com' },
];

const daysOfWeek = [
    { key: 'monday', label: 'M' },
    { key: 'tuesday', label: 'T' },
    { key: 'wednesday', label: 'W' },
    { key: 'thursday', label: 'T' },
    { key: 'friday', label: 'F' },
    { key: 'saturday', label: 'S' },
    { key: 'sunday', label: 'S' }
];

export function ManageDistractionsDialog({
    user,
    isOpen,
    onOpenChange,
    blockedSitesCount,
    onBlockedSitesUpdated
}: ManageDistractionsDialogProps) {
    const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
    const [searchQuery, setSearchQuery] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState('');
    const [showTimeControls, setShowTimeControls] = useState<Record<number, boolean>>({});

    // Default time limits for new sites
    const defaultWeekdayLimits: WeekdayLimits = {
        monday: { enabled: true, minutes: 15 },
        tuesday: { enabled: true, minutes: 15 },
        wednesday: { enabled: true, minutes: 15 },
        thursday: { enabled: true, minutes: 15 },
        friday: { enabled: true, minutes: 15 },
        saturday: { enabled: true, minutes: 15 },
        sunday: { enabled: true, minutes: 15 }
    };

    const [newSiteWeekdayLimits, setNewSiteWeekdayLimits] = useState<WeekdayLimits>(defaultWeekdayLimits);
    const [editingSiteId, setEditingSiteId] = useState<number | null>(null);
    const [currentSiteWeekdayLimits, setCurrentSiteWeekdayLimits] = useState<WeekdayLimits>(defaultWeekdayLimits);

    // Use the hook for blocked site management
    const {
        blockedSites,
        loading,
        fetchBlockedSites,
        addBlockedSite,
        removeBlockedSite,
        updateMaxDailyVisits,
        updateDayTimeLimit,
        getBlockedSiteStats,
        formatTime
    } = useBlockedSite({ user });

    // Stats for each site's usage
    const [siteStats, setSiteStats] = useState<any[]>([]);

    // Fetch data when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Fetch blocked sites and stats
    const fetchData = async () => {
        try {
            const sites = await fetchBlockedSites();
            const stats = await getBlockedSiteStats();
            setSiteStats(stats);
        } catch (err) {
            console.error("Error in fetchData:", err);
        }
    };

    // Toggle specific day for new site
    const toggleNewSiteDay = (day: string) => {
        const dayKey = day as keyof WeekdayLimits;
        setNewSiteWeekdayLimits(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                enabled: !prev[dayKey].enabled
            }
        }));
    };

    // Set time limit for specific day for new site
    const setNewSiteTimeLimit = (day: string, minutes: number) => {
        const dayKey = day as keyof WeekdayLimits;
        setNewSiteWeekdayLimits(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                minutes
            }
        }));
    };

    // Apply same time limit to all days
    const applyToAllDays = (minutes: number) => {
        const updated = { ...newSiteWeekdayLimits };

        Object.keys(updated).forEach(day => {
            const dayKey = day as keyof WeekdayLimits;
            updated[dayKey].minutes = minutes;
        });

        setNewSiteWeekdayLimits(updated);
    };

    // Toggle day for existing site
    const toggleSiteDay = async (siteId: number, day: string, currentEnabled: boolean) => {
        const dayKey = day as keyof WeekdayLimits;
        const success = await updateDayTimeLimit(
            siteId,
            dayKey,
            !currentEnabled,
            currentSiteWeekdayLimits[dayKey].minutes
        );

        if (success) {
            setCurrentSiteWeekdayLimits(prev => ({
                ...prev,
                [dayKey]: {
                    ...prev[dayKey],
                    enabled: !currentEnabled
                }
            }));
            await fetchData();
        }
    };

    // Set time limit for specific day for existing site
    const setSiteTimeLimit = async (siteId: number, day: string, minutes: number) => {
        const dayKey = day as keyof WeekdayLimits;
        const success = await updateDayTimeLimit(
            siteId,
            dayKey,
            currentSiteWeekdayLimits[dayKey].enabled,
            minutes
        );

        if (success) {
            setCurrentSiteWeekdayLimits(prev => ({
                ...prev,
                [dayKey]: {
                    ...prev[dayKey],
                    minutes
                }
            }));
            await fetchData();
        }
    };

    // Handle domain input validation and submission
    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newDomain.trim()) {
            setDomainError('Please enter a domain');
            return;
        }

        // Basic domain validation
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        const formattedDomain = newDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/i, '');

        if (!domainRegex.test(formattedDomain)) {
            setDomainError('Please enter a valid domain (e.g., example.com)');
            return;
        }

        try {
            // Convert new site settings to appropriate format for API
            const daySettings: Record<string, boolean | number> = {};

            Object.entries(newSiteWeekdayLimits).forEach(([day, settings]) => {
                daySettings[`${day}_enabled`] = settings.enabled;
                daySettings[`${day}_time_limit_minutes`] = settings.minutes;
            });

            const result = await addBlockedSite(formattedDomain, 3, daySettings);

            if (result) {
                setNewDomain('');
                setDomainError('');
                await fetchData();
                await onBlockedSitesUpdated();
                setActiveTab('current');
            }
        } catch (error) {
            setDomainError('Failed to add domain. Please try again.');
        }
    };

    // Quick add a popular site
    const handleQuickAdd = async (site: PopularSite) => {
        try {
            // Convert new site settings to appropriate format for API
            const daySettings: Record<string, boolean | number> = {};

            Object.entries(newSiteWeekdayLimits).forEach(([day, settings]) => {
                daySettings[`${day}_enabled`] = settings.enabled;
                daySettings[`${day}_time_limit_minutes`] = settings.minutes;
            });

            const result = await addBlockedSite(site.domain, 3, daySettings);

            if (result) {
                await fetchData();
                await onBlockedSitesUpdated();
                toast.success(`${site.domain} added to blocked sites`);
            }
        } catch (err) {
            toast.error(`Failed to add ${site.domain}`);
        }
    };

    // Handle site removal
    const handleRemoveSite = async (id: number) => {
        const success = await removeBlockedSite(id);
        if (success) {
            await fetchData();
            await onBlockedSitesUpdated();
        }
    };

    // Handle visit limit updates
    const handleUpdateLimit = async (id: number, maxVisits: number) => {
        const success = await updateMaxDailyVisits(id, maxVisits);
        if (success) {
            await fetchData();
        }
    };

    // Toggle time controls visibility and load current settings
    const toggleTimeControls = (id: number, site: BlockedSite) => {
        if (showTimeControls[id]) {
            // Closing the controls
            setShowTimeControls(prev => ({
                ...prev,
                [id]: false
            }));
            setEditingSiteId(null);
        } else {
            // Opening the controls - load current settings from site
            const currentSettings: WeekdayLimits = {
                monday: { enabled: site.monday_enabled, minutes: site.monday_time_limit_minutes },
                tuesday: { enabled: site.tuesday_enabled, minutes: site.tuesday_time_limit_minutes },
                wednesday: { enabled: site.wednesday_enabled, minutes: site.wednesday_time_limit_minutes },
                thursday: { enabled: site.thursday_enabled, minutes: site.thursday_time_limit_minutes },
                friday: { enabled: site.friday_enabled, minutes: site.friday_time_limit_minutes },
                saturday: { enabled: site.saturday_enabled, minutes: site.saturday_time_limit_minutes },
                sunday: { enabled: site.sunday_enabled, minutes: site.sunday_time_limit_minutes }
            };

            setCurrentSiteWeekdayLimits(currentSettings);
            setShowTimeControls(prev => ({
                ...prev,
                [id]: true
            }));
            setEditingSiteId(id);
        }
    };

    // Filter available popular sites
    const availablePopularSites = popularSites.filter(
        site => !blockedSites.some(blocked => blocked.domain === site.domain)
    );

    // Get site brand color
    const getSiteBrandColor = (domain: string) => {
        const siteName = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0].toLowerCase();

        switch (siteName) {
            case 'facebook': return { bg: '#1877F2', text: 'white' };
            case 'instagram': return { bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', text: 'white' };
            case 'twitter':
            case 'x': return { bg: '#1DA1F2', text: 'white' };
            case 'tiktok': return { bg: '#000000', text: 'white' };
            case 'youtube': return { bg: '#FF0000', text: 'white' };
            case 'reddit': return { bg: '#FF4500', text: 'white' };
            case 'linkedin': return { bg: '#0A66C2', text: 'white' };
            case 'pinterest': return { bg: '#E60023', text: 'white' };
            case 'snapchat': return { bg: '#FFFC00', text: 'black' };
            case 'whatsapp': return { bg: '#25D366', text: 'white' };
            case 'telegram': return { bg: '#0088cc', text: 'white' };
            case 'discord': return { bg: '#5865F2', text: 'white' };
            default: return { bg: '#4F46E5', text: 'white' }; // Default to indigo-600
        }
    };

    // Calculate today's usage for a site
    const getTodayUsage = (site: BlockedSite, stats: any[]) => {
        const siteStat = stats?.find(s => s.domain === site.domain);
        if (!siteStat) return { visits: 0, timeMinutes: 0 };

        return {
            visits: siteStat.todayCount || 0,
            timeMinutes: Math.round((siteStat.todayTimeSeconds || 0) / 60)
        };
    };

    // Get time limit for today
    const getTodayLimit = (site: BlockedSite) => {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Type-safe day mapping
        const dayMap: Record<number, keyof WeekdayLimits> = {
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday',
            0: 'sunday'
        };

        const dayKey = dayMap[today];

        // Use type assertion to safely access these properties
        const enabled = site[`${dayKey}_enabled`] as boolean;
        const minutes = site[`${dayKey}_time_limit_minutes`] as number;

        return { enabled, minutes };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
            <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-0 border-0 bg-transparent overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'add')}>
                            {/* Fixed Header - Simplified without explicit close button */}
                            <DialogHeader className="p-0 sticky top-0 z-10">
                                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 p-4 sm:p-6 text-white">
                                    <DialogTitle className="text-xl sm:text-2xl font-bold mb-1 flex items-center">
                                        <Ban className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                                        Manage Distractions
                                    </DialogTitle>
                                    {/* Tabs Navigation */}
                                    <TabsList className="grid w-full grid-cols-2 p-1 bg-blue-600/30 rounded-lg mt-3 sm:mt-4">
                                        <TabsTrigger
                                            value="current"
                                            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all text-xs sm:text-sm"
                                        >
                                            Blocked Sites ({blockedSitesCount})
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="add"
                                            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all text-xs sm:text-sm"
                                        >
                                            Add New
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            </DialogHeader>

                            {/* Scrollable Content Area */}
                            <ScrollArea className="flex-grow overflow-y-auto max-h-[calc(90vh-230px)]">
                                <div className="p-3 sm:p-6">
                                    <TabsContent value="current" className="space-y-4 mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        <BlockedSitesList
                                            loading={loading}
                                            blockedSites={blockedSites}
                                            siteStats={siteStats}
                                            searchQuery={searchQuery}
                                            setActiveTab={setActiveTab}
                                            showTimeControls={showTimeControls}
                                            editingSiteId={editingSiteId}
                                            currentSiteWeekdayLimits={currentSiteWeekdayLimits}
                                            toggleTimeControls={toggleTimeControls}
                                            handleRemoveSite={handleRemoveSite}
                                            toggleSiteDay={toggleSiteDay}
                                            setSiteTimeLimit={setSiteTimeLimit}
                                            handleUpdateLimit={updateMaxDailyVisits}
                                            getTodayUsage={getTodayUsage}
                                            getTodayLimit={getTodayLimit}
                                            getSiteBrandColor={getSiteBrandColor}
                                        />
                                    </TabsContent>

                                    <TabsContent value="add" className="space-y-5 mt-0 focus-visible:outline-none focus-visible:ring-0">
                                        <AddNewSiteForm
                                            popularSites={popularSites}
                                            availablePopularSites={availablePopularSites}
                                            loading={loading}
                                            newDomain={newDomain}
                                            setNewDomain={setNewDomain}
                                            domainError={domainError}
                                            setDomainError={setDomainError}
                                            newSiteWeekdayLimits={newSiteWeekdayLimits}
                                            toggleNewSiteDay={toggleNewSiteDay}
                                            setNewSiteTimeLimit={setNewSiteTimeLimit}
                                            applyToAllDays={applyToAllDays}
                                            handleAddDomain={handleAddDomain}
                                            handleQuickAdd={handleQuickAdd}
                                        />
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}