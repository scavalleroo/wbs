import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ban, Flame, Loader2, MinusCircle, PlusCircle, Trash2, Trophy } from 'lucide-react';
import { SocialIcon } from 'react-social-icons';

interface BlockedSite {
    id: number;
    domain: string;
    max_daily_visits: number;
}

interface SiteStats {
    domain: string;
    todayCount: number;
    maxDailyVisits?: number;
}

interface BlockedSitesListProps {
    loading: boolean;
    blockedSites: BlockedSite[];
    stats: SiteStats[];
    onUpdateLimit: (id: number, currentLimit: number, increment: boolean) => Promise<void>;
    onRemoveDomain: (id: number) => Promise<void>;
    onAddSite: () => void;
}

export function BlockedSitesList({
    loading,
    blockedSites,
    stats,
    onUpdateLimit,
    onRemoveDomain,
    onAddSite
}: BlockedSitesListProps) {
    const [filteredSites, setFilteredSites] = useState<BlockedSite[] | null>(null);

    return (
        <>
            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : blockedSites.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <Ban className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="font-medium text-lg mb-1">No websites blocked</h3>
                    <p className="text-muted-foreground mb-4">
                        Add your first distraction site to start building focus habits
                    </p>
                    <Button onClick={onAddSite}>
                        <Ban className="mr-2 h-4 w-4" />
                        Block Your First Site
                    </Button>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <Input
                            placeholder="TikTok, Facebook, etc."
                            onChange={(e) => {
                                const filterValue = e.target.value.toLowerCase();
                                setFilteredSites(
                                    blockedSites.filter(site =>
                                        site.domain.toLowerCase().includes(filterValue)
                                    )
                                );
                            }}
                            className="max-w-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(filteredSites || blockedSites).map((site) => {
                            // Find stats for this site
                            const siteStats = stats.find(s => s.domain === site.domain) || {
                                todayCount: 0,
                                maxDailyVisits: site.max_daily_visits || 3
                            };
                            const todayVisits = siteStats.todayCount || 0;
                            const maxVisits = site.max_daily_visits || 3;

                            return (
                                <div key={site.id} className="border rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900 shadow-sm">
                                    {/* Website Name and Streak */}
                                    <div className="mb-3">
                                        <div className="flex items-center">
                                            <SocialIcon
                                                network={site.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0]}
                                                style={{ height: 24, width: 24 }}
                                                className="mr-2"
                                                fgColor="currentColor"
                                                bgColor="transparent"
                                            />
                                            <h3 className="font-medium text-sm truncate">{site.domain}</h3>
                                        </div>
                                        {siteStats.todayCount > 0 && (
                                            <div className="flex items-center text-xs text-amber-500 mt-1">
                                                <Flame className="h-3 w-3 mr-1" />
                                                <span>{siteStats.todayCount} day streak</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Usage Info */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-sm">
                                            <span>{todayVisits}/{maxVisits} opens today</span>
                                            {todayVisits === 0 && (
                                                <div className="flex items-center text-green-600 text-xs mt-1">
                                                    <Trophy className="h-3 w-3 mr-1" /> Perfect!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-between mt-2">
                                        {/* Daily visit limit controls */}
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onUpdateLimit(site.id, maxVisits, false)}
                                            >
                                                <MinusCircle className="h-3 w-3" />
                                            </Button>

                                            <span className="text-center w-8">{maxVisits}</span>

                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onUpdateLimit(site.id, maxVisits, true)}
                                            >
                                                <PlusCircle className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Delete button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveDomain(site.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}