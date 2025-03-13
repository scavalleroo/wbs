import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { BlockedSite, BlockedSiteAttempt, UseBlockedSiteParams } from '@/types/report.types';
import { startOfDay, isToday, subDays } from 'date-fns';

// Supabase client setup
const supabase = createClient();

export function useBlockedSite({ user }: UseBlockedSiteParams) {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [attempts, setAttempts] = useState<BlockedSiteAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all blocked sites for the user
  const fetchBlockedSites = useCallback(async () => {
    if (!user) {
      setBlockedSites([]);
      return [];
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('blocked_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBlockedSites(data as BlockedSite[]);
      setError(null);
      return data as BlockedSite[];
    } catch (err) {
      console.error('Error fetching blocked sites:', err);
      setError('Failed to load blocked sites');
      toast.error('Failed to load blocked sites');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new domain to block with default max_daily_visits
  const addBlockedSite = useCallback(async (domain: string, maxDailyVisits = 3) => {
    if (!user) return null;

    try {
      setLoading(true);
      
      // Normalize the domain (remove protocol, www, etc)
      const normalizedDomain = domain.toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0];
      
      // Check if domain is already blocked
      const { data: existingData } = await supabase
        .from('blocked_sites')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', normalizedDomain)
        .maybeSingle();
      
      if (existingData) {
        toast.error(`Domain ${normalizedDomain} is already blocked`);
        return existingData as BlockedSite;
      }
      
      // Add new blocked site
      const { data, error } = await supabase
        .from('blocked_sites')
        .insert({
          user_id: user.id,
          domain: normalizedDomain,
          max_daily_visits: maxDailyVisits
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setBlockedSites(prev => [data as BlockedSite, ...prev]);
      toast.success(`Domain ${normalizedDomain} blocked successfully`);
      return data as BlockedSite;
    } catch (err) {
      console.error('Error adding blocked site:', err);
      toast.error('Failed to block domain');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update max daily visits for a site
  const updateMaxDailyVisits = useCallback(async (id: number, maxVisits: number) => {
    if (!user) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('blocked_sites')
        .update({ max_daily_visits: maxVisits })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setBlockedSites(prev => 
        prev.map(site => 
          site.id === id ? { ...site, max_daily_visits: maxVisits } : site
        )
      );
      
      toast.success('Daily limit updated');
      return true;
    } catch (err) {
      console.error('Error updating max daily visits:', err);
      toast.error('Failed to update daily limit');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Remove a domain from block list
  const removeBlockedSite = useCallback(async (id: number) => {
    if (!user) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('blocked_sites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure users can only delete their own blocked sites
      
      if (error) throw error;
      
      setBlockedSites(prev => prev.filter(site => site.id !== id));
      toast.success('Domain unblocked successfully');
      return true;
    } catch (err) {
      console.error('Error removing blocked site:', err);
      toast.error('Failed to unblock domain');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Record an access attempt to a blocked site
  const recordAttempt = useCallback(async (domain: string, blockedSiteId: number, bypassed = false) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('blocked_site_attempts')
        .insert({
          user_id: user.id,
          domain: domain,
          blocked_site_id: blockedSiteId,
          bypassed: bypassed
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Check if this breaks a streak (only if bypassed)
      if (bypassed) {
        const site = blockedSites.find(s => s.id === blockedSiteId);
        if (site) {
          const todayAttempts = await getTodayBypassedAttemptsForSite(domain);
          if (todayAttempts >= (site.max_daily_visits || 3)) {
            // Daily bypass limit exceeded, update streak
            await updateStreak(false);
          }
        }
      }
      
      return data as BlockedSiteAttempt;
    } catch (err) {
      console.error('Error recording access attempt:', err);
      return null;
    }
  }, [user, blockedSites]);

  // Helper to get today's bypassed attempts for a specific site
  const getTodayBypassedAttemptsForSite = useCallback(async (domain: string) => {
    if (!user) return 0;
    
    try {
      const today = startOfDay(new Date()).toISOString();
      
      const { data, error } = await supabase
        .from('blocked_site_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', domain)
        .eq('bypassed', true)
        .gte('created_at', today);
      
      if (error) throw error;
      
      return data?.length || 0;
    } catch (err) {
      console.error('Error getting today\'s bypassed attempts:', err);
      return 0;
    }
  }, [user]);

  // Get bypass attempts for a specified number of days
  const getBypassAttempts = useCallback(async (days = 7) => {
    if (!user) return [];
    
    try {
      const startDate = subDays(new Date(), days).toISOString();
      
      const { data, error } = await supabase
        .from('blocked_site_attempts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as BlockedSiteAttempt[];
    } catch (err) {
      console.error('Error getting bypass attempts:', err);
      return [];
    }
  }, [user]);

  // Check if a domain is blocked
  const checkIfBlocked = useCallback(async (domain: string) => {
    if (!user) return false;

    try {
      // Normalize the domain
      const normalizedDomain = domain.toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0];
      
      const { data } = await supabase
        .from('blocked_sites')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', normalizedDomain)
        .maybeSingle();
      
      if (data) {
        // Record the attempt (not bypassed by default)
        await recordAttempt(normalizedDomain, data.id, false);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error checking blocked status:', err);
      return false;
    }
  }, [user, recordAttempt]);

  // Update user streak
  const updateStreak = useCallback(async (maintained = true) => {
    if (!user) return;
    
    try {
      // Get current streak
      const { data: streakData } = await supabase
        .from('blocked_site_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!streakData) {
        // Create first streak record
        await supabase.from('blocked_site_streaks').insert({
          user_id: user.id,
          streak_days: maintained ? 1 : 0,
          last_perfect_day: new Date().toISOString().split('T')[0]
        });
        return;
      }
      
      // Update existing streak
      if (maintained) {
        await supabase
          .from('blocked_site_streaks')
          .update({
            streak_days: streakData.streak_days + 1,
            last_perfect_day: new Date().toISOString().split('T')[0]
          })
          .eq('id', streakData.id);
      } else {
        // Reset streak
        await supabase
          .from('blocked_site_streaks')
          .update({
            streak_days: 0,
            last_perfect_day: new Date().toISOString().split('T')[0]
          })
          .eq('id', streakData.id);
      }
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  }, [user]);

  // Get current streak days
  const getStreak = useCallback(async () => {
    if (!user) return 0;
    
    try {
      const { data } = await supabase
        .from('blocked_site_streaks')
        .select('streak_days')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return data?.streak_days || 0;
    } catch (err) {
      console.error('Error getting streak:', err);
      return 0;
    }
  }, [user]);

  // Get statistics for blocked sites (number of attempts)
  const getBlockedSiteStats = useCallback(async () => {
    if (!user) return [];

    try {
      setLoading(true);
      
      // Get all attempts
      const { data: attemptsData, error } = await supabase
        .from('blocked_site_attempts')
        .select(`
          domain,
          blocked_site_id,
          created_at,
          bypassed
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAttempts(attemptsData as BlockedSiteAttempt[]);
      
      // Get all blocked sites
      const sites = await fetchBlockedSites();
      
      // Group attempts by domain and count
      const statsMap = attemptsData.reduce((acc: any, attempt) => {
        if (!acc[attempt.domain]) {
          // Get the site for this domain
          const site = sites.find(s => s.domain === attempt.domain);
          
          acc[attempt.domain] = {
            domain: attempt.domain,
            count: 0,
            todayCount: 0,
            bypassedCount: 0,
            lastAttempt: null,
            maxDailyVisits: site?.max_daily_visits || 3
          };
        }
        
        // Increment total count
        acc[attempt.domain].count++;
        
        // Increment bypassed count if the attempt was bypassed
        if (attempt.bypassed) {
          acc[attempt.domain].bypassedCount++;
          
          // Check if bypass attempt is from today
          if (isToday(new Date(attempt.created_at))) {
            acc[attempt.domain].todayCount++;
          }
        }
        
        // Track the most recent attempt
        if (!acc[attempt.domain].lastAttempt || 
            new Date(attempt.created_at) > new Date(acc[attempt.domain].lastAttempt)) {
          acc[attempt.domain].lastAttempt = attempt.created_at;
        }
        
        return acc;
      }, {});
      
      // Calculate streak for each domain
      for (const domain of Object.keys(statsMap)) {
        // For simplicity, we're giving a "streak" if today's visits are within limits
        const site = sites.find(s => s.domain === domain);
        if (site) {
          const todayCount = statsMap[domain].todayCount;
          const maxVisits = site.max_daily_visits || 3;
          
          // If they haven't exceeded the limit today, they're on a streak
          statsMap[domain].streakCount = todayCount <= maxVisits ? 1 : 0;
          // For a real app, you'd track this over days in the database
        }
      }
      
      return Object.values(statsMap);
    } catch (err) {
      console.error('Error fetching blocked site statistics:', err);
      toast.error('Failed to load blocked site statistics');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, fetchBlockedSites]);
  
  // Get recent attempts
  const getRecentAttempts = useCallback(async (limit = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('blocked_site_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data as BlockedSiteAttempt[];
    } catch (err) {
      console.error('Error fetching recent attempts:', err);
      return [];
    }
  }, [user]);

  return {
    blockedSites,
    attempts,
    loading,
    error,
    fetchBlockedSites,
    addBlockedSite,
    removeBlockedSite,
    checkIfBlocked,
    getBlockedSiteStats,
    getRecentAttempts,
    getBypassAttempts, // Added new function
    updateMaxDailyVisits,
    getStreak
  };
}