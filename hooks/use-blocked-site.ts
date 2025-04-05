import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { AttemptDetail, BlockedSite, BlockedSiteAttempt, DailyFocusData } from '@/types/report.types';
import { startOfDay, isToday, subDays, format, isFuture, endOfDay, eachDayOfInterval } from 'date-fns';
import { UserIdParam } from '@/types/types';

export function useBlockedSite({ user }: UserIdParam) {
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
  const [attempts, setAttempts] = useState<BlockedSiteAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
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

  // Add a new domain to block with default limits
  const addBlockedSite = useCallback(async (domain: string, maxDailyVisits = 3, daySettings = {}) => {
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
      
      // Add new blocked site with time limits
      const { data, error } = await supabase
        .from('blocked_sites')
        .insert({
          user_id: user.id,
          domain: normalizedDomain,
          max_daily_visits: maxDailyVisits,
          ...daySettings
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
      
      toast.success('Visit limit updated');
      return true;
    } catch (err) {
      console.error('Error updating max daily visits:', err);
      toast.error('Failed to update visit limit');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update day-specific time limit for a site
  const updateDayTimeLimit = useCallback(async (id: number, day: string, enabled: boolean, minutes: number) => {
    if (!user) return false;

    try {
      setLoading(true);
      
      const updateData = {
        [`${day}_enabled`]: enabled,
        [`${day}_time_limit_minutes`]: minutes
      };
      
      const { error } = await supabase
        .from('blocked_sites')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setBlockedSites(prev => 
        prev.map(site => 
          site.id === id ? { ...site, ...updateData } : site
        )
      );
      
      toast.success(`${day.charAt(0).toUpperCase() + day.slice(1)} limit updated`);
      return true;
    } catch (err) {
      console.error('Error updating day time limit:', err);
      toast.error('Failed to update time limit');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Start a session when accessing a blocked site
  const startSession = useCallback(async (domain: string, blockedSiteId: number, bypassed = false) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('blocked_site_attempts')
        .insert({
          user_id: user.id,
          domain: domain,
          blocked_site_id: blockedSiteId,
          bypassed: bypassed,
          session_start: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data as BlockedSiteAttempt;
    } catch (err) {
      console.error('Error starting site session:', err);
      return null;
    }
  }, [user]);
  
  // End a session and record duration
  const endSession = useCallback(async (attemptId: number) => {
    if (!user) return false;

    try {
      // Get the current session
      const { data: session } = await supabase
        .from('blocked_site_attempts')
        .select('session_start')
        .eq('id', attemptId)
        .single();
        
      if (!session) return false;
      
      const sessionStart = new Date(session.session_start);
      const sessionEnd = new Date();
      const durationSeconds = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 1000);
      
      // Update the session with end time and duration
      const { error } = await supabase
        .from('blocked_site_attempts')
        .update({
          session_end: sessionEnd.toISOString(),
          duration_seconds: durationSeconds
        })
        .eq('id', attemptId);
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error ending site session:', err);
      return false;
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
        .eq('user_id', user.id);
      
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
    return startSession(domain, blockedSiteId, bypassed);
  }, [startSession]);

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

  // Get statistics for blocked sites (visits and time)
  const getBlockedSiteStats = useCallback(async () => {
    if (!user) return [];

    try {
      setLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get all attempts
      const { data: attemptsData, error } = await supabase
        .from('blocked_site_attempts')
        .select(`
          domain,
          blocked_site_id,
          created_at,
          bypassed,
          duration_seconds
        `)
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
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
          
          // Get today's day name (lowercase)
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const dayKey = today as keyof Pick<BlockedSite, 
            'monday_enabled' | 'tuesday_enabled' | 'wednesday_enabled' | 
            'thursday_enabled' | 'friday_enabled' | 'saturday_enabled' | 'sunday_enabled'>;
          
          acc[attempt.domain] = {
            domain: attempt.domain,
            count: 0,
            todayCount: 0,
            todayTimeSeconds: 0,
            bypassedCount: 0,
            lastAttempt: null,
            maxDailyVisits: site?.max_daily_visits || 3,
            maxDailyTimeSeconds: site ? site[`${dayKey}_time_limit_minutes`] * 60 : 300
          };
        }
        
        // Increment total count
        acc[attempt.domain].count++;
        
        // Increment bypassed count if the attempt was bypassed
        if (attempt.bypassed) {
          acc[attempt.domain].bypassedCount++;
          acc[attempt.domain].todayCount++;
          
          // Add duration if available
          if (attempt.duration_seconds) {
            acc[attempt.domain].todayTimeSeconds += attempt.duration_seconds;
          }
        }
        
        // Track the most recent attempt
        if (!acc[attempt.domain].lastAttempt || 
            new Date(attempt.created_at) > new Date(acc[attempt.domain].lastAttempt)) {
          acc[attempt.domain].lastAttempt = attempt.created_at;
        }
        
        return acc;
      }, {});
      
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

  // Get focus data for different time ranges with proper scoring
  const getFocusData = useCallback(async (
    timeRange: 'week' | 'month' | 'year' = 'week',
    isPreviousPeriod: boolean = false
  ) => {
    if (!user) return { focusData: [], currentScore: null };
    
    try {
      // Determine number of days based on time range
      let days: number;
      switch (timeRange) {
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
  
      // Calculate date ranges - different logic for current vs previous period
      let startDate: Date, endDate: Date;
      
      if (isPreviousPeriod) {
        // For previous period, shift the entire window back by the period length
        endDate = subDays(new Date(), days);
        startDate = subDays(endDate, days - 1);
      } else {
        // Current period (original logic)
        endDate = new Date();
        startDate = subDays(endDate, days - 1);
      }
  
      // Get date range as array of days
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
      // Format dates for DB query
      const queryStartDate = startOfDay(dateRange[0]).toISOString();
      const queryEndDate = endOfDay(dateRange[dateRange.length - 1]).toISOString();
  
      // Fetch attempts data from the database
      const { data: attemptsData, error } = await supabase
        .from('blocked_site_attempts')
        .select(`
          domain,
          created_at,
          bypassed
        `)
        .eq('user_id', user.id)
        .gte('created_at', queryStartDate)
        .lte('created_at', queryEndDate)
        .order('created_at', { ascending: true });
  
      if (error) throw error;
  
      // Process data by day
      const focusData = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isFutureDate = isFuture(date);
        
        // Filter attempts for this day
        const dayAttempts = attemptsData?.filter(attempt => 
          format(new Date(attempt.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        
        // Count attempts and bypasses
        const totalAttempts = dayAttempts.length;
        const totalBypasses = dayAttempts.filter(a => a.bypassed).length;
        
        // Get details by domain
        const detailsByDomain = dayAttempts.reduce((acc, attempt) => {
          if (!acc[attempt.domain]) {
            acc[attempt.domain] = { domain: attempt.domain, attempts: 0, bypasses: 0 };
          }
          
          acc[attempt.domain].attempts += 1;
          if (attempt.bypassed) {
            acc[attempt.domain].bypasses += 1;
          }
          
          return acc;
        }, {} as Record<string, AttemptDetail>);
        
        // Calculate focus score
        let focusScore: number | null = null;
        
        if (isFutureDate) {
          // Future dates get no score
          focusScore = null;
        } else if (totalAttempts > 0) {
          // Calculate score if there were actual attempts
          focusScore = calculateFocusScore(totalAttempts, totalBypasses);
        } else {
          // Days with no data get null (not 100)
          focusScore = null;
        }
        
        return {
          date: dateStr,
          formattedDate: format(date, isPreviousPeriod ? "MMM dd '(prev)'" : 'MMM dd'),
          focusScore,
          attempts: totalAttempts,
          bypasses: totalBypasses,
          attemptDetails: Object.values(detailsByDomain),
          isFutureDate,
          hasData: totalAttempts > 0,
          isPreviousPeriod
        } as DailyFocusData;
      });
  
      // Calculate period score based on most recent day WITH DATA
      const periodScore = focusData
        .slice()
        .reverse()
        .find(data => data.hasData)?.focusScore ?? null;
  
      return { 
        focusData,
        currentScore: periodScore
      };
    } catch (err) {
      console.error('Error fetching focus data:', err);
      return { 
        focusData: [],
        currentScore: null 
      };
    }
  }, [user]);

  // Calculate focus score based on attempts and bypasses
  const calculateFocusScore = (attempts: number, bypasses: number): number => {
    // Each attempt reduces score by 1 point, each bypass by 2 points
    const penalty = (attempts * 1) + (bypasses * 2);
    const score = 100 - penalty;
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  };

  // Get count of blocked sites
  const getBlockedSitesCount = useCallback(async () => {
    if (!user) return 0;

    try {
      // Use count() query for efficiency
      const { count, error } = await supabase
        .from('blocked_sites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return count || 0;
    } catch (err) {
      console.error('Error getting blocked sites count:', err);
      return 0;
    }
  }, [user]);

  // Format time for display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getBlockedSitesWithTimeAllowance = useCallback(async () => {
    if (!user) return [];
    
    try {
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = dayNames[dayOfWeek];
      const enabledColumn = `${today}_enabled`;
      const timeColumn = `${today}_time_limit_minutes`;
      
      const { data, error } = await supabase
        .from('blocked_sites')
        .select(`id, domain, ${enabledColumn}, ${timeColumn}`)
        .eq('user_id', user.id)
        .eq(enabledColumn, true) // Only get sites enabled for today
        .gt(timeColumn, 0);      // Only get sites with time allowance > 0
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Error loading blocked sites with time allowance:', err);
      return [];
    }
  }, [user, supabase]);
  
  // Calculate total allowed distraction time for today from all sites
  const getTotalAllowedDistractionTime = useCallback(async () => {
    if (!user) return 30; // Default 30 minutes
    
    try {
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = dayNames[dayOfWeek];
      const enabledColumn = `${today}_enabled`;
      const timeColumn = `${today}_time_limit_minutes`;
      
      // Get all blocked sites for the user that are enabled for today
      const { data: blockedSites, error } = await supabase
        .from('blocked_sites')
        .select(`id, domain, ${enabledColumn}, ${timeColumn}`)
        .eq('user_id', user.id)
        .eq(enabledColumn, true); // Only get sites enabled for today
      
      if (error) throw error;
      
      if (!blockedSites || blockedSites.length === 0) {
        return 30; // Default if no blocked sites
      }
      
      // Calculate total allowed time across all sites for today
      let totalAllowedMinutes = 0;
      
      blockedSites.forEach((site: any) => {
        // Get the allowed minutes for today
        const allowedMinutes = site[timeColumn] || 0;
        totalAllowedMinutes += allowedMinutes;
      });
      
      // Return at least 5 minutes if the total is very low but not zero
      // If total is 0 (all sites completely blocked), return default minimum
      return totalAllowedMinutes > 0 ? Math.max(5, totalAllowedMinutes) : 30;
    } catch (err) {
      console.error('Error calculating allowed distraction time:', err);
      return 30; // Default on error
    }
  }, [user, supabase]);

  // Add this new function to the useBlockedSite hook

// Ensure this function is properly implemented in your hook

const getDistractionCalendarData = useCallback(async () => {
  if (!user) return new Map();

  try {
    // Calculate date range for last 28 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 28);

    // Format dates for DB query
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(today, 'yyyy-MM-dd');

    // Get distractions data directly from blocked_site_attempts
    const { data: attempts, error } = await supabase
      .from('blocked_site_attempts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${startDateStr}T00:00:00`)
      .lte('created_at', `${endDateStr}T23:59:59`);

    if (error) throw error;

    // Get daily distraction limits from user settings or default
    const allowedTime = await getTotalAllowedDistractionTime();

    // Create a map to store data by date
    const daysMap = new Map();

    // Group attempts by day
    if (attempts && attempts.length > 0) {
      // Debug logging to check if we're getting data
      console.log(`Found ${attempts.length} blocked site attempts`);
      
      const attemptsByDay: any = {};

      // Initialize days
      const dayRange = eachDayOfInterval({
        start: startDate,
        end: today
      });

      dayRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        attemptsByDay[dateStr] = {
          totalMinutes: 0,
          attempts: 0,
          bypasses: 0
        };
      });

      // Process each attempt
      attempts.forEach((attempt) => {
        const date = new Date(attempt.created_at);
        const dateStr = format(date, 'yyyy-MM-dd');

        if (!attemptsByDay[dateStr]) {
          attemptsByDay[dateStr] = {
            totalMinutes: 0,
            attempts: 0,
            bypasses: 0
          };
        }

        // Count all attempts
        attemptsByDay[dateStr].attempts++;

        // Count bypasses and add duration
        if (attempt.bypassed) {
          attemptsByDay[dateStr].bypasses++;

          // Add duration if available, otherwise estimate
          if (attempt.duration_seconds) {
            attemptsByDay[dateStr].totalMinutes += attempt.duration_seconds / 60;
          } else {
            // Estimate 5 minutes per bypass if duration not tracked
            attemptsByDay[dateStr].totalMinutes += 5;
          }
        }
      });

      // Create DistractionDay objects for the map
      Object.entries(attemptsByDay).forEach(([dateStr, data]: any) => {
        const date = new Date(dateStr);
        const minutes = Math.round(data.totalMinutes);
        const limitRespected = minutes <= allowedTime;

        daysMap.set(dateStr, {
          date,
          minutes,
          attemptCount: data.attempts,
          bypassCount: data.bypasses,
          limitMinutes: allowedTime,
          limitRespected
        });
      });
    } else {
      console.log("No blocked site attempts found in database");
    }

    return daysMap;
  } catch (err) {
    console.error('Error fetching distraction calendar data:', err);
    return new Map();
  }
}, [user, supabase, getTotalAllowedDistractionTime]);

  return {
    blockedSites,
    attempts,
    loading,
    error,
    fetchBlockedSites,
    addBlockedSite,
    removeBlockedSite,
    checkIfBlocked,
    recordAttempt,
    getBlockedSiteStats,
    getRecentAttempts,
    getBypassAttempts,
    updateMaxDailyVisits,
    updateDayTimeLimit,
    startSession,
    endSession,
    getFocusData,
    formatTime,
    getBlockedSitesCount,
    calculateFocusScore,
    getBlockedSitesWithTimeAllowance,
    getTotalAllowedDistractionTime,
    getDistractionCalendarData,
  };
}