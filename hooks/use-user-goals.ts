import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { UserIdParam } from '@/types/types';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useBlockedSite } from './use-blocked-site';

export type UserGoal = {
  id: number;
  user_id: string;
  date: string;
  focus_time_minutes: number;
  distraction_time_minutes: number;
  created_at: string;
  updated_at: string;
};

export type GoalProgress = {
  date: string;
  focusGoalMinutes: number;
  focusActualMinutes: number;
  distractionGoalMinutes: number;
  distractionActualMinutes: number;
  focusGoalMet: boolean;
  distractionGoalMet: boolean;
  streak: number;
};

export const useUserGoals = ({ user }: UserIdParam) => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [todayGoal, setTodayGoal] = useState<UserGoal | null>(null);
  const [goalStreak, setGoalStreak] = useState(0);
  const { getTotalAllowedDistractionTime } = useBlockedSite({ user });

  // Get goal for specific date (default: today)
  const getGoalForDate = useCallback(async (date?: Date) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      const targetDate = date || new Date();
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // If goal exists, return it
        return data as UserGoal;
      } else {
        // If no goal, check previous day to copy values
        const yesterday = subDays(targetDate, 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        const { data: prevData } = await supabase
          .from('user_daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', yesterdayStr)
          .maybeSingle();
        
        // Create a new goal with either previous values or defaults
        const newGoal = {
          user_id: user.id,
          date: dateStr,
          focus_time_minutes: prevData?.focus_time_minutes || 120, // 2 hours default
        };
        
        const { data: createdGoal, error: createError } = await supabase
          .from('user_daily_goals')
          .insert(newGoal)
          .select()
          .single();
        
        if (createError) throw createError;
        
        return createdGoal as UserGoal;
      }
    } catch (err) {
      // console.error('Error getting goal for date:', err); // Keep console log for debugging
      console.error('Error getting goal for date:', err);
      toast.error('Failed to load daily goal. Please try again.'); // Add user-facing toast
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, supabase]); // Added supabase dependency

  // Get today's goal
  const getTodayGoal = useCallback(async () => {
    const goal = await getGoalForDate();
    if (goal) {
      setTodayGoal(goal);
    }
    return goal;
  }, [getGoalForDate]);

  // Update goal for specific date
  const updateGoal = useCallback(async (
    goalId: number,
    updates: {
      focus_time_minutes?: number;
      distraction_time_minutes?: number;
    }
  ) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state if it's today's goal
      if (todayGoal && todayGoal.id === goalId) {
        setTodayGoal(data as UserGoal);
      }
      
      toast.success('Goal updated successfully');
      return data as UserGoal;
    } catch (err) {
      console.error('Error updating goal:', err);
      toast.error('Failed to update goal');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, todayGoal]);

  // Calculate today's progress and check if goals were met
  const getTodayProgress = useCallback(async () => {
    if (!user) return null;

    try {
      setLoading(true);

      // 1. Get today's goal (create if doesn't exist)
      const goal = await getTodayGoal();
      // if (!goal) throw new Error('Failed to get today\'s goal'); // Replace throw
      if (!goal) {
          console.error("Failed to get or create today's goal in getTodayProgress.");
          toast.error("Could not load today's goal progress."); // Add user-facing toast
          return null; // Return null instead of throwing
      }

      // 2. Get distraction goal from blocked sites settings
      const distractionGoalMinutes = await getTotalAllowedDistractionTime();

      // 2. Get focus sessions for today
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      
      // Get completed focus sessions for today
      const { data: focusSessions, error: focusError } = await supabase
        .from('focus_sessions')
        .select('actual_duration')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      if (focusError) throw focusError;
      
      // 3. Calculate focus time (in seconds, convert to minutes)
      const focusTimeSeconds = focusSessions?.reduce(
        (total, session) => total + (session.actual_duration || 0), 
        0
      ) || 0;
      
      const focusTimeMinutes = Math.floor(focusTimeSeconds / 60);
      
      // 4. Get distraction time (from blocked sites) for today
      const { data: distractions, error: distractError } = await supabase
        .from('blocked_site_attempts')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .eq('bypassed', true)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      if (distractError) throw distractError;
      
      // Calculate total distraction time (in seconds, convert to minutes)
      const distractionSeconds = distractions?.reduce(
        (total, attempt) => total + (attempt.duration_seconds || 0),
        0
      ) || 0;
      
      const distractionMinutes = Math.ceil(distractionSeconds / 60);
      
      // 5. Check if goals were met
      const focusGoalMet = focusTimeMinutes >= goal.focus_time_minutes;
      
      // 6. Get active focus session if any (to add to the total)
      const { data: activeSession, error: activeError } = await supabase
        .from('focus_sessions')
        .select('duration, actual_duration, flow_mode, started_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (activeError) throw activeError;
      
      // Calculate additional time from active session
      let activeMinutes = 0;
      if (activeSession) {
        const startTime = new Date(activeSession.started_at);
        const currentTime = new Date();
        const elapsedMillis = currentTime.getTime() - startTime.getTime();
        activeMinutes = Math.floor(elapsedMillis / (1000 * 60));
      }
      
      // Final results
      return {
        focusGoalMinutes: goal.focus_time_minutes,
        focusActualMinutes: focusTimeMinutes + activeMinutes,
        distractionGoalMinutes,
        distractionActualMinutes: distractionMinutes,
        focusGoalMet,
        distractionGoalMet: distractionMinutes <= distractionGoalMinutes,
        goalId: goal.id
      };
    } catch (err) {
      console.error('Error getting today\'s progress:', err);
      toast.error('Failed to calculate goal progress.'); // Add user-facing toast for other errors
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getTodayGoal, getTotalAllowedDistractionTime, supabase]); // Added supabase dependency

  // Calculate streak of consecutive days meeting both goals
  const calculateStreak = useCallback(async () => {
    if (!user) return 0;
    
    try {
      setLoading(true);
      
      // Get focus session data for the past 100 days to check streak
      const pastDate = subDays(new Date(), 100).toISOString();
      
      // Track checked dates to avoid duplicates
      const checkedDates = new Set<string>();
      let streak = 0;
      let streakBroken = false;
      
      // Process each day starting from yesterday
      for (let i = 1; i <= 100 && !streakBroken; i++) {
        const checkDate = subDays(new Date(), i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        
        // Skip if already checked this date
        if (checkedDates.has(dateStr)) continue;
        checkedDates.add(dateStr);
        
        // 1. Get goal for this date
        const { data: goalData } = await supabase
          .from('user_daily_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .maybeSingle();
        
        // If no goal set for this day, break the streak
        if (!goalData) {
          streakBroken = true;
          continue;
        }
        
        // 2. Get focus sessions for this day
        const dayStart = startOfDay(checkDate).toISOString();
        const dayEnd = endOfDay(checkDate).toISOString();
        
        const { data: focusSessions } = await supabase
          .from('focus_sessions')
          .select('actual_duration')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);
        
        // 3. Calculate focus time (in seconds, convert to minutes)
        const focusTimeSeconds = focusSessions?.reduce(
          (total, session) => total + (session.actual_duration || 0), 
          0
        ) || 0;
        
        const focusTimeMinutes = Math.floor(focusTimeSeconds / 60);
        
        // 4. Get distraction time for this day
        const { data: distractions } = await supabase
          .from('blocked_site_attempts')
          .select('duration_seconds')
          .eq('user_id', user.id)
          .eq('bypassed', true)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);
        
        // Calculate total distraction time (in seconds, convert to minutes)
        const distractionSeconds = distractions?.reduce(
          (total, attempt) => total + (attempt.duration_seconds || 0),
          0
        ) || 0;
        
        const distractionMinutes = Math.ceil(distractionSeconds / 60);
        
        // 5. Check if goals were met
        const focusGoalMet = focusTimeMinutes >= goalData.focus_time_minutes;
        const distractionGoalMet = distractionMinutes <= goalData.distraction_time_minutes;
        
        // Continue streak only if both goals were met
        if (focusGoalMet && distractionGoalMet) {
          streak++;
        } else {
          streakBroken = true;
        }
      }
      
      setGoalStreak(streak);
      return streak;
    } catch (err) {
      console.error('Error calculating streak:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    todayGoal,
    goalStreak,
    getGoalForDate,
    getTodayGoal,
    updateGoal,
    getTodayProgress,
    calculateStreak
  };
};