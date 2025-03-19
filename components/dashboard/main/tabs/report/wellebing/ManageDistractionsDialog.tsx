import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, Loader2, Flame, MinusCircle, PlusCircle, Trash2, Trophy } from "lucide-react";
import { SocialIcon } from 'react-social-icons';
import { toast } from 'sonner';
import { useBlockedSite } from "@/hooks/use-blocked-site";
import { UserIdParam } from '@/types/types';
import { BlockedSite } from '@/types/report.types';

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

const popularSites: PopularSite[] = [
    { name: 'Facebook', domain: 'facebook.com' },
    { name: 'Instagram', domain: 'instagram.com' },
    { name: 'Twitter', domain: 'twitter.com' },
    { name: 'TikTok', domain: 'tiktok.com' },
    { name: 'YouTube', domain: 'youtube.com' },
    { name: 'Reddit', domain: 'reddit.com' },
    { name: 'LinkedIn', domain: 'linkedin.com' },
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
    const [filteredSites, setFilteredSites] = useState<BlockedSite[] | null>(null);

    // Use the hook for blocked site management
    const {
        blockedSites,
        loading,
        fetchBlockedSites,
        addBlockedSite,
        removeBlockedSite,
        updateMaxDailyVisits,
        getBlockedSiteStats
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
        await fetchBlockedSites();
        const stats = await getBlockedSiteStats();
        setSiteStats(stats);
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
            const result = await addBlockedSite(formattedDomain, 3);
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
            const result = await addBlockedSite(site.domain, 3);
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

    // Handle limit updates
    const handleUpdateLimit = async (id: number, currentLimit: number, increment: boolean) => {
        const newLimit = increment ? currentLimit + 1 : Math.max(1, currentLimit - 1);
        const success = await updateMaxDailyVisits(id, newLimit);
        if (success) {
            await fetchData();
        }
    };

    // Filter available popular sites
    const availablePopularSites = popularSites.filter(
        site => !blockedSites.some(blocked => blocked.domain === site.domain)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Distractions</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'add')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="current">
                            Blocked Sites ({blockedSitesCount})
                        </TabsTrigger>
                        <TabsTrigger value="add">Add New</TabsTrigger>
                    </TabsList>

                    {/* Current blocked sites tab */}
                    <TabsContent value="current" className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : blockedSites.length === 0 ? (
                            <div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
                                <Ban className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <h3 className="font-medium text-lg mb-1">No websites blocked</h3>
                                <p className="text-muted-foreground mb-4">
                                    Add your first distraction site to start building focus habits
                                </p>
                                <Button onClick={() => setActiveTab('add')}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Block Your First Site
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Search blocked sites..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mb-2"
                                />

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {blockedSites
                                        .filter(site => site.domain.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((site) => {
                                            // Find stats for this site
                                            const siteStat = siteStats?.find((s: { domain: string }) => s.domain === site.domain) || {
                                                todayCount: 0,
                                                maxDailyVisits: site.max_daily_visits || 3
                                            };
                                            const todayVisits = siteStat.todayCount || 0;
                                            const maxVisits = site.max_daily_visits || 3;

                                            return (
                                                <div key={site.id} className="border rounded-lg p-3 bg-neutral-50 dark:bg-neutral-900">
                                                    <div className="flex items-center justify-between">
                                                        {/* Domain and stats */}
                                                        <div>
                                                            <div className="flex items-center">
                                                                <SocialIcon
                                                                    network={site.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]}
                                                                    style={{ height: 20, width: 20 }}
                                                                    className="mr-2"
                                                                    fgColor="currentColor"
                                                                    bgColor="transparent"
                                                                />
                                                                <span className="font-medium text-sm">{site.domain}</span>
                                                            </div>

                                                            <div className="text-xs mt-1 text-neutral-500">
                                                                {todayVisits}/{maxVisits} opens today
                                                                {todayVisits === 0 && (
                                                                    <span className="text-green-600 ml-2 flex items-center">
                                                                        <Trophy className="h-3 w-3 mr-1" /> Perfect!
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Controls */}
                                                        <div className="flex items-center space-x-2">
                                                            {/* Daily visit limit controls */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleUpdateLimit(site.id, maxVisits, false)}
                                                            >
                                                                <MinusCircle className="h-3 w-3" />
                                                            </Button>

                                                            <span className="text-center w-5 text-sm">{maxVisits}</span>

                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleUpdateLimit(site.id, maxVisits, true)}
                                                            >
                                                                <PlusCircle className="h-3 w-3" />
                                                            </Button>

                                                            {/* Delete button */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveSite(site.id)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Add new sites tab */}
                    <TabsContent value="add" className="space-y-4">
                        {/* Quick add popular sites */}
                        {availablePopularSites.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Quick add popular sites:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {availablePopularSites.map((site) => (
                                        <Button
                                            key={site.domain}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickAdd(site)}
                                            disabled={loading}
                                        >
                                            {site.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual domain add form */}
                        <form onSubmit={handleAddDomain} className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="example.com"
                                        value={newDomain}
                                        onChange={(e) => {
                                            setNewDomain(e.target.value);
                                            setDomainError('');
                                        }}
                                        className={domainError ? "border-red-500" : ""}
                                    />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Site"}
                                </Button>
                            </div>
                            {domainError && (
                                <p className="text-xs text-red-500">{domainError}</p>
                            )}
                        </form>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}