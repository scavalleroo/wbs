import { useState, useCallback, useEffect, useRef } from 'react';
import { FocusSession, FocusSessionCreate, FocusSessionUpdate, FocusSessionStats } from '@/types/focus-session.types';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { UserIdParam } from '@/types/types';

export const useFocusSession = ({ user }: UserIdParam) => {
    const supabase = createClient();
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState<FocusSessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local session tracking (no intervals or DB polling)
  const sessionStartTime = useRef<Date | null>(null);

  // Check for active session on mount (cleanup any orphaned sessions)
  useEffect(() => {
    if (user?.id) {
      cleanupOrphanedSessions();
    }
  }, [user?.id]);

  // Cleanup any orphaned active sessions on mount (mark them as abandoned)
  const cleanupOrphanedSessions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Find any active sessions and mark them as abandoned
      // This handles cases where the user closed the app without properly ending a session
      const { error } = await supabase
        .from('focus_sessions')
        .update({
          status: 'abandoned',
          ended_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) {
        console.error('Error cleaning up orphaned sessions:', error);
      }
    } catch (err) {
      console.error('Error in cleanupOrphanedSessions:', err);
    }
  }, [user?.id]);

  // Start a new focus session (only called when user presses play)
  const startSession = useCallback(async (sessionData: Omit<FocusSessionCreate, 'user_id'>) => {
    if (!user?.id) {
      toast.error('You must be logged in to start a focus session');
      return null;
    }

    try {
      setLoading(true);
      
      // Create new session in database
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert([{
          user_id: user.id,
          activity: sessionData.activity,
          sound: sessionData.sound,
          duration: sessionData.duration,
          actual_duration: 0,
          flow_mode: sessionData.flow_mode,
          status: 'active'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Set local state
      setCurrentSession(data);
      sessionStartTime.current = new Date();
      
      return data;
    } catch (err) {
      console.error('Error starting focus session:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error('Failed to start focus session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // End the current session (only called when user presses stop)
  const endSession = useCallback(async (
    sessionId: string, 
    status: 'completed' | 'abandoned' = 'completed'
  ) => {
    try {
      setLoading(true);
      
      if (!sessionId || !sessionStartTime.current) return null;
      
      // Calculate actual duration based on start time
      const endTime = new Date();
      const actualDuration = Math.floor((endTime.getTime() - sessionStartTime.current.getTime()) / 1000);
      
      // Only save sessions longer than 1 minute (60 seconds)
      if (actualDuration < 60 && status === 'completed') {
        status = 'abandoned'; // Mark short sessions as abandoned
      }
      
      // Update session in database with final duration
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          actual_duration: actualDuration,
          ended_at: endTime.toISOString(),
          status: status
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear local session state
      setCurrentSession(null);
      sessionStartTime.current = null;
      
      // Show success message for completed sessions
      if (status === 'completed' && actualDuration >= 60) {
        const minutes = Math.floor(actualDuration / 60);
        toast.success(`Focus session completed! 🎉 (${minutes}m ${actualDuration % 60}s)`);
      }
      
      return data;
    } catch (err) {
      console.error('Error ending focus session:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error('Failed to end focus session');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get today's total focus time for the user
  const getTodaysFocusTime = useCallback(async () => {
    if (!user?.id) return 0;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('actual_duration')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());
      
      if (error) throw error;
      
      const totalSeconds = data?.reduce((sum, session) => sum + session.actual_duration, 0) || 0;
      return totalSeconds;
    } catch (err) {
      console.error('Error fetching today\'s focus time:', err);
      return 0;
    }
  }, [user?.id]);

  // Delete a focus session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.id || !sessionId) {
      toast.error('Unable to delete session');
      return false;
    }
    
    try {
      setLoading(true);
      
      // Delete session from database
      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Remove from local state if exists
      setRecentSessions(prev => prev.filter(session => session.id !== sessionId));
      
      return true;
    } catch (err) {
      console.error('Error deleting focus session:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err; // Rethrow for handling in the component
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get user's recent focus sessions
  const fetchRecentSessions = useCallback(async (limit = 10) => {
    if (!user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      setRecentSessions(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching recent focus sessions:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return [];
    }
  }, [user?.id]);

  // Get user's focus session statistics
  const fetchSessionStats = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      // Get completed sessions
      const { data: sessions, error } = await supabase
        .from('focus_sessions')
        .select('actual_duration, activity, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      if (!sessions || sessions.length === 0) {
        setStats({
          total_sessions: 0,
          total_duration: 0,
          average_duration: 0,
          favorite_activity: 'none',
          streak_days: 0
        });
        return null;
      }
      
      // Calculate total and average durations
      const totalDuration = sessions.reduce((sum, session) => sum + session.actual_duration, 0);
      const avgDuration = Math.round(totalDuration / sessions.length);
      
      // Find favorite activity
      const activityCounts = sessions.reduce((acc, session) => {
        acc[session.activity] = (acc[session.activity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const favoriteActivity = Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calculate streak
      const sessionDates = sessions.map(s => {
        const date = new Date(s.created_at);
        return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
      });
      
      const uniqueDates = [...new Set(sessionDates)].sort();
      let streak = 0;
      
      if (uniqueDates.length > 0) {
        // Check if there's a session today
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
        const hasToday = uniqueDates.includes(todayStr);
        
        if (hasToday) {
          streak = 1;
          const yesterday = new Date(today);
          
          // Count backwards from today
          for (let i = 1; i <= 365; i++) {
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
            
            if (uniqueDates.includes(dateStr)) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
      
      const statsData = {
        total_sessions: sessions.length,
        total_duration: totalDuration,
        average_duration: avgDuration,
        favorite_activity: favoriteActivity,
        streak_days: streak
      };
      
      setStats(statsData);
      return statsData;
    } catch (err) {
      console.error('Error fetching focus session stats:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  }, [user?.id]);

  return {
    currentSession,
    recentSessions,
    stats,
    loading,
    error,
    startSession,
    endSession,
    fetchRecentSessions,
    fetchSessionStats,
    deleteSession,
    getTodaysFocusTime,
    cleanupOrphanedSessions
  };
};