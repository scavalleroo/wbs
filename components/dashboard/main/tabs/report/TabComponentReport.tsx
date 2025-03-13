import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    Loader2,
    Trash2,
    Ban,
    Flame,
    PlusCircle,
    MinusCircle,
    Trophy,
    Calendar,
    ChevronDown,
    Award,
    Star,
} from 'lucide-react';
import { format, formatDistanceToNow, subDays, eachDayOfInterval } from 'date-fns';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mostPopularDomains } from '@/utils/constants';

interface FocusTabContentProps {
    user: User | null | undefined;
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

export function TabComponentReport({ user }: FocusTabContentProps) {
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState('');
    const [timeRange, setTimeRange] = useState('week');
    const [bypassData, setBypassData] = useState<BypassData[]>([]);
    const [bypassByDomain, setBypassByDomain] = useState<BypassData[]>([]);
    const [isAddingDomain, setIsAddingDomain] = useState(false);
    const [filteredSites, setFilteredSites] = useState<any[] | null>(null);
    const [stats, setStats] = useState<Array<{
        domain: string;
        count: number;
        todayCount: number;
        bypassedCount: number;
        lastAttempt: string;
        maxDailyVisits?: number;
        streakCount?: number;
    }>>([]);
    const [streakDays, setStreakDays] = useState(0);

    const {
        blockedSites,
        loading,
        fetchBlockedSites,
        addBlockedSite,
        removeBlockedSite,
        getBlockedSiteStats,
        updateMaxDailyVisits,
        getStreak,
        getBypassAttempts
    } = useBlockedSite({ user });

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchBlockedSites();
            const siteStats = await getBlockedSiteStats();
            setStats(siteStats as any[]);
            const streak = await getStreak();
            setStreakDays(streak);

            // Load bypass data for chart
            await loadBypassData(timeRange);
        };

        loadData();
    }, [fetchBlockedSites, getBlockedSiteStats, getStreak]);

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
                attempt => format(new Date(attempt.created_at), 'yyyy-MM-dd') === dateStr && attempt.bypassed
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
                attempt => attempt.domain === site.domain && attempt.bypassed
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

    const handleTimeRangeChange = (range: string) => {
        setTimeRange(range);
        loadBypassData(range);
    };

    // Calculate the total number of bypassed attempts for the selected time range
    const totalBypassCount = bypassData.reduce((sum, day) => sum + day.count, 0);

    return (
        <TabsContent value="report" className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] overflow-y-auto'>
            <div className="space-y-6 max-w-screen-lg mx-auto px-2 w-full">
                {/* Gamified Streak Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white bg-opacity-20 p-3 rounded-full">
                                {streakDays > 0 ? (
                                    <Flame className="h-8 w-8 text-amber-200" />
                                ) : (
                                    <Calendar className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Focus Streak</h2>
                                <div className="flex items-center">
                                    {streakDays > 0 ? (
                                        <p className="text-white text-lg font-semibold">
                                            {streakDays} day{streakDays !== 1 ? 's' : ''} streak!
                                        </p>
                                    ) : (
                                        <p className="text-white text-lg">Start your streak today!</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="bg-white bg-opacity-20 rounded-full p-2">
                                <Award className="h-6 w-6 text-amber-200" />
                            </div>
                            <span className="text-xs text-white mt-1">Level {Math.floor(streakDays / 5) + 1}</span>
                        </div>
                    </div>

                    {/* Level Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-white mb-1">
                            <span>Progress to level {Math.floor(streakDays / 5) + 2}</span>
                            <span>{streakDays % 5}/{5} days</span>
                        </div>
                        <Progress
                            value={(streakDays % 5) * 20}
                            className="h-2 bg-white bg-opacity-20"
                        />
                    </div>
                </div>

                {/* Unified Card with Tabs */}
                <Card className="shadow-md bg-neutral-50 dark:bg-neutral-900">
                    <div className="p-4 border-b">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                {/* <TabsTrigger value="sites">Manage Sites</TabsTrigger>
                                <TabsTrigger value="stats">Detailed Stats</TabsTrigger> */}
                            </TabsList>

                            {/* Overview Tab Content */}
                            <div className="pt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Visits Over Time</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={timeRange === 'week' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleTimeRangeChange('week')}
                                        >
                                            Week
                                        </Button>
                                        <Button
                                            variant={timeRange === 'month' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleTimeRangeChange('month')}
                                        >
                                            Month
                                        </Button>
                                        <Button
                                            variant={timeRange === 'year' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleTimeRangeChange('year')}
                                        >
                                            Year
                                        </Button>
                                    </div>
                                </div>

                                {/* Visualization of bypass data */}
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={bypassData}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#f59e0b"
                                                fill="#fcd34d"
                                                name="Bypass Events"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

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
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <h4 className="text-sm text-green-600 dark:text-green-400">Streak</h4>
                                        <p className="text-2xl font-bold">{streakDays} days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Manage Sites Tab Content */}
                            <div className="pt-4 space-y-4">
                                {/* Add new domain button/form */}
                                <Collapsible
                                    open={isAddingDomain}
                                    onOpenChange={setIsAddingDomain}
                                    className="border rounded-md"
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant={isAddingDomain ? "secondary" : "default"}
                                            className={`w-full flex justify-between ${isAddingDomain ? "mb-0" : "mb-4"}`}
                                        >
                                            <span className="flex items-center">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add a new website
                                            </span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${isAddingDomain ? "transform rotate-180" : ""}`} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-4 space-y-4 border-t">
                                        {/* Quick Add Popular Sites */}
                                        {mostPopularDomains.filter(site =>
                                            !blockedSites.some(blocked => blocked.domain === site.domain)
                                        ).length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-medium mb-2">Quick add popular sites:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mostPopularDomains
                                                            .filter(site => !blockedSites.some(blocked => blocked.domain === site.domain))
                                                            .map((site) => (
                                                                <Button
                                                                    key={site.domain}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const result = await addBlockedSite(site.domain, 3);
                                                                            if (result) {
                                                                                const siteStats = await getBlockedSiteStats();
                                                                                setStats(siteStats as any[]);
                                                                                await loadBypassData(timeRange);
                                                                                toast.success(`${site.domain} added to blocked sites`);
                                                                            }
                                                                        } catch (err) {
                                                                            toast.error(`Failed to add ${site.domain}`);
                                                                        }
                                                                    }}
                                                                    disabled={loading}
                                                                >
                                                                    {site.name}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                        <form onSubmit={handleAddDomain} className="flex items-start space-x-2">
                                            <div className="flex-1 space-y-1">
                                                <Input
                                                    placeholder="example.com"
                                                    value={newDomain}
                                                    onChange={(e) => setNewDomain(e.target.value)}
                                                    className={domainError ? "border-red-500" : ""}
                                                />
                                                {domainError && (
                                                    <p className="text-xs text-red-500">{domainError}</p>
                                                )}
                                            </div>
                                            <Button type="submit" disabled={loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                                Add site
                                            </Button>
                                        </form>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Blocked Sites List */}
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
                                        <Button onClick={() => setIsAddingDomain(true)}>
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
                                                    setFilteredSites(blockedSites.filter(site =>
                                                        site.domain.toLowerCase().includes(filterValue)
                                                    ));
                                                }}
                                                className="max-w-sm"
                                            />
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Website</TableHead>
                                                    <TableHead>Daily Limit</TableHead>
                                                    <TableHead>Today's Usage</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(filteredSites || blockedSites).map((site) => {
                                                    // Find stats for this site
                                                    const siteStats = stats.find(s => s.domain === site.domain) || {
                                                        todayCount: 0,
                                                        maxDailyVisits: site.max_daily_visits || 3
                                                    };
                                                    const todayVisits = siteStats.todayCount || 0;
                                                    const maxVisits = site.max_daily_visits || 3;
                                                    const percentage = maxVisits > 0 ? Math.min(100, (todayVisits / maxVisits) * 100) : 0;

                                                    return (
                                                        <TableRow key={site.id}>
                                                            <TableCell className="font-medium">
                                                                <div>{site.domain}</div>
                                                                {siteStats.todayCount > 0 && (
                                                                    <div className="flex items-center text-xs text-amber-500 mt-1">
                                                                        <Flame className="h-3 w-3 mr-1" />
                                                                        {siteStats.todayCount} day streak
                                                                    </div>
                                                                )}
                                                            </TableCell>

                                                            {/* Daily visit limit controls */}
                                                            <TableCell>
                                                                <div className="flex items-center space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => handleUpdateLimit(site.id, maxVisits, false)}
                                                                    >
                                                                        <MinusCircle className="h-3 w-3" />
                                                                    </Button>

                                                                    <span className="text-center w-8">{maxVisits}</span>

                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => handleUpdateLimit(site.id, maxVisits, true)}
                                                                    >
                                                                        <PlusCircle className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>

                                                            {/* Today's usage with progress bar */}
                                                            <TableCell>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span>{todayVisits} / {maxVisits}</span>
                                                                        {todayVisits === 0 && (
                                                                            <span className="flex items-center text-green-600">
                                                                                <Trophy className="h-3 w-3 mr-1" /> Perfect!
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <Progress
                                                                        value={percentage}
                                                                        className={percentage >= 100 ? "bg-red-100" : ""}
                                                                    />
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveDomain(site.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Remove</span>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </div>
                        </Tabs>
                    </div>
                </Card>
            </div>
        </TabsContent>
    );
}