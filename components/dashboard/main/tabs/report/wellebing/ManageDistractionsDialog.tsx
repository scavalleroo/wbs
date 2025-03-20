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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {/* Gradient Header */}
                        <DialogHeader className="p-0">
                            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-1">Manage Distractions</DialogTitle>
                                <p className="opacity-80">Control your focus by limiting distracting sites</p>
                            </div>
                        </DialogHeader>

                        {/* Content Area */}
                        <div className="p-6">
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'add')} className="w-full">
                                {/* Enhanced tab styling with more evident selection */}
                                <TabsList className="grid w-full grid-cols-2 mb-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    <TabsTrigger
                                        value="current"
                                        className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all"
                                    >
                                        Blocked Sites ({blockedSitesCount})
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="add"
                                        className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all"
                                    >
                                        Add New
                                    </TabsTrigger>
                                </TabsList>

                                {/* Current blocked sites tab */}
                                <TabsContent value="current" className="space-y-4">
                                    {/* ...existing loading and empty states... */}

                                    {/* Site list with brand colors */}
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

                                                // Calculate usage percentage for progress bar
                                                const usagePercent = Math.min(100, (todayVisits / maxVisits) * 100);

                                                // Get brand colors
                                                const brandColor = getSiteBrandColor(site.domain);
                                                const siteName = site.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
                                                const isGradient = brandColor.bg.startsWith('bg-');

                                                return (
                                                    <div
                                                        key={site.id}
                                                        className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow"
                                                    >
                                                        {/* Usage progress indicator */}
                                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-700">
                                                            <div
                                                                className={`h-full transition-all duration-300 ${todayVisits === 0 ? "bg-emerald-500" :
                                                                    todayVisits >= maxVisits ? "bg-rose-500" :
                                                                        todayVisits > maxVisits * 0.5 ? "bg-amber-500" : "bg-blue-500"
                                                                    }`}
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>

                                                        <div className="p-3">
                                                            <div className="flex items-center justify-between">
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
                                                                        <div>
                                                                            <span className="font-medium text-sm truncate block">{site.domain}</span>
                                                                            {/* Visually enhanced stats badge */}
                                                                            <div className="flex items-center mt-1 text-xs">
                                                                                <div className="flex items-center px-1.5 py-0.5 rounded-full bg-opacity-10 border"
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
                                                                                    <span className="ml-1 opacity-70">visits</span>
                                                                                </div>

                                                                                {todayVisits === 0 && (
                                                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center ml-2">
                                                                                        <Trophy className="h-3 w-3 mr-1" /> Perfect!
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Controls */}
                                                                <div className="flex items-center space-x-2">
                                                                    {/* Improved limit controls */}
                                                                    <div className="flex items-center rounded-full h-7 border shadow-sm bg-white dark:bg-neutral-800 overflow-hidden">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                                            onClick={() => handleUpdateLimit(site.id, maxVisits, false)}
                                                                            title="Decrease limit"
                                                                        >
                                                                            <MinusCircle className="h-3.5 w-3.5" />
                                                                        </Button>

                                                                        <div className="px-1.5">
                                                                            <span className="text-xs font-medium">{maxVisits}</span>
                                                                        </div>

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                                            onClick={() => handleUpdateLimit(site.id, maxVisits, true)}
                                                                            title="Increase limit"
                                                                        >
                                                                            <PlusCircle className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>

                                                                    {/* Delete button */}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveSite(site.id)}
                                                                        className="h-7 w-7 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                                        title="Remove site"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </TabsContent>

                                {/* Add new sites tab */}
                                <TabsContent value="add" className="space-y-5">
                                    {/* Quick add popular sites */}
                                    {availablePopularSites.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Quick add popular sites:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {availablePopularSites.map((site) => (
                                                    <Button
                                                        key={site.domain}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleQuickAdd(site)}
                                                        disabled={loading}
                                                        className="bg-white dark:bg-neutral-800"
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
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Site"}
                                            </Button>
                                        </div>
                                        {domainError && (
                                            <p className="text-xs text-red-500">{domainError}</p>
                                        )}
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-6 border-t dark:border-neutral-800">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}