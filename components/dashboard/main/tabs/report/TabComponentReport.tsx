import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';
import { useBlockedSite } from '@/hooks/use-blocked-site';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    Calendar,
    Clock,
    Flame,
    PlusCircle,
    MinusCircle,
    Trophy
} from 'lucide-react';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';

interface FocusTabContentProps {
    user: User | null | undefined;
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
    const [stats, setStats] = useState<Array<{
        domain: string;
        count: number;
        todayCount: number;
        lastAttempt: string;
        maxDailyVisits?: number;
        streakCount?: number;
    }>>([]);
    const [recentAttempts, setRecentAttempts] = useState<Array<any>>([]);
    const [streakDays, setStreakDays] = useState(0);

    const {
        blockedSites,
        loading,
        error,
        fetchBlockedSites,
        addBlockedSite,
        removeBlockedSite,
        getBlockedSiteStats,
        getRecentAttempts,
        updateMaxDailyVisits,
        getStreak
    } = useBlockedSite({ user });

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchBlockedSites();
            const siteStats = await getBlockedSiteStats();
            setStats(siteStats as any[]);
            const attempts = await getRecentAttempts(10);
            setRecentAttempts(attempts);
            const streak = await getStreak();
            setStreakDays(streak);
        };

        loadData();
    }, [fetchBlockedSites, getBlockedSiteStats, getRecentAttempts, getStreak]);

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

    return (
        <TabsContent value="report" className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] max-w-screen-lg mx-auto px-2 overflow-y-auto'>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    {/* Streak display */}
                    {streakDays > 0 && (
                        <div className="flex items-center bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 py-1 px-3 rounded-full">
                            <Flame className="h-5 w-5 mr-1 text-amber-500" />
                            <span className="font-medium">{streakDays} day{streakDays > 1 ? 's' : ''} streak!</span>
                        </div>
                    )}
                </div>

                {/* Add new domain */}
                <Card>
                    <CardHeader>
                        <CardTitle>Block a Website</CardTitle>
                        <CardDescription>
                            Add a domain to block distracting websites
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddDomain} className="flex items-end space-x-2">
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
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                                Block Site
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Blocked Sites List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blocked Websites</CardTitle>
                        <CardDescription>
                            Currently blocked domains and daily allowances
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : blockedSites.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No websites are currently blocked
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Daily Limit</TableHead>
                                        <TableHead>Today's Usage</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blockedSites.map((site) => {
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
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Added {format(new Date(site.created_at), 'PP')}
                                                    </div>
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
                                                        // indicatorClassName={percentage >= 100 ? "bg-red-500" : ""}
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
                        )}
                    </CardContent>
                </Card>

                {/* Access Attempt Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle>Access Attempts</CardTitle>
                        <CardDescription>
                            Stats on blocked website access attempts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : stats.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No access attempts recorded
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Domain</TableHead>
                                        <TableHead className="text-right">Today</TableHead>
                                        <TableHead className="text-right">Total Attempts</TableHead>
                                        <TableHead className="text-right">Last attempt</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.map((stat) => (
                                        <TableRow key={stat.domain}>
                                            <TableCell className="font-medium">
                                                {stat.domain}
                                                <div className="flex items-center text-xs text-amber-500 mt-1">
                                                    <Flame className="h-3 w-3 mr-1" />
                                                    {stat.streakCount ?? 0} day streak
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={stat.todayCount > 0 ? "text-amber-500 font-medium" : "text-green-500 font-medium"}>
                                                    {stat.todayCount || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{stat.count}</TableCell>
                                            <TableCell className="text-right">
                                                {formatDistanceToNow(new Date(stat.lastAttempt), { addSuffix: true })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Attempts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Access Attempts</CardTitle>
                        <CardDescription>
                            Latest attempts to access blocked sites
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : recentAttempts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No recent access attempts
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentAttempts.map((attempt) => (
                                    <div key={attempt.id} className="flex items-center justify-between border-b pb-2">
                                        <div className="font-medium">
                                            {attempt.domain}
                                            {isToday(new Date(attempt.created_at)) && (
                                                <span className="ml-2 text-xs bg-amber-100 text-amber-800 py-0.5 px-1.5 rounded-full">Today</span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-muted-foreground text-sm">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            <span className="mr-3">{format(new Date(attempt.created_at), 'PP')}</span>
                                            <Clock className="mr-1 h-3 w-3" />
                                            <span>{format(new Date(attempt.created_at), 'p')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    );
}