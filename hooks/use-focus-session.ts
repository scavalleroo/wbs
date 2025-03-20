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

  // Tracking session with interval
  const sessionInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date | null>(null);

  // Check for active session on mount
  useEffect(() => {
    if (user?.id) {
      checkForActiveSession();
    }
    
    return () => {
      if (sessionInterval.current) {
        clearInterval(sessionInterval.current);
      }
    };
  }, [user?.id]);

  // Check if user has an active focus session
  const checkForActiveSession = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setCurrentSession(data);
        
        // Start tracking time for active session
        sessionStartTime.current = new Date(data.started_at);
        startSessionTracking();
      } else {
        setCurrentSession(null);
        stopSessionTracking();
      }
      
      return data;
    } catch (err) {
      console.error('Error checking for active focus session:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error('Failed to check for active focus sessions');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Start a new focus session
  const startSession = useCallback(async (sessionData: Omit<FocusSessionCreate, 'user_id'>) => {
    if (!user?.id) {
      toast.error('You must be logged in to start a focus session');
      return null;
    }

    try {
      setLoading(true);
      
      // First, ensure there are no active sessions
      await endAllActiveSessions('abandoned');
      
      // Create new session
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
      
      setCurrentSession(data);
      sessionStartTime.current = new Date();
      startSessionTracking();
      
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

  // End a specific session
  const endSession = useCallback(async (
    sessionId: string, 
    status: 'completed' | 'abandoned' = 'completed'
  ) => {
    try {
      setLoading(true);
      
      if (!sessionId) return null;
      
      // Calculate actual duration
      let actualDuration = 0;
      if (currentSession && currentSession.id === sessionId && sessionStartTime.current) {
        const endTime = new Date();
        actualDuration = Math.floor((endTime.getTime() - sessionStartTime.current.getTime()) / 1000);
      } else if (currentSession) {
        actualDuration = currentSession.actual_duration;
      }
      
      // Only save sessions longer than 1 minutes (60 seconds)
      if (actualDuration < 60 && status === 'completed') {
        status = 'abandoned'; // Mark short sessions as abandoned
      }
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          actual_duration: actualDuration,
          ended_at: new Date().toISOString(),
          status: status
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear current session if it matches
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(null);
        stopSessionTracking();
      }
      
      // If completed successfully and over 2 minutes
      if (status === 'completed') {
        toast.success('Focus session completed! 🎉');
      }
      
      // Refresh recent sessions
      fetchRecentSessions();
      
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
  }, [currentSession]);

  // End all active sessions for the user
  const endAllActiveSessions = useCallback(async (status: 'completed' | 'abandoned' = 'abandoned') => {
    if (!user?.id) return;
    
    try {
      // First, get all active sessions
      const { data: activeSessions, error: fetchError } = await supabase
        .from('focus_sessions')
        .select('id, started_at, actual_duration')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (fetchError) throw fetchError;
      
      // End each active session
      if (activeSessions && activeSessions.length > 0) {
        const now = new Date();
        
        for (const session of activeSessions) {
          const startTime = new Date(session.started_at);
          const actualDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          
          await supabase
            .from('focus_sessions')
            .update({
              actual_duration: actualDuration,
              ended_at: now.toISOString(),
              status: status
            })
            .eq('id', session.id);
        }
      }
      
      stopSessionTracking();
      setCurrentSession(null);
    } catch (err) {
      console.error('Error ending active sessions:', err);
    }
  }, [user?.id]);

  // Update the current session's actual duration in the background
  const updateSessionDuration = useCallback(async () => {
    if (!currentSession || !sessionStartTime.current || !user?.id) return;
    
    try {
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000);
      
      await supabase
        .from('focus_sessions')
        .update({
          actual_duration: actualDuration
        })
        .eq('id', currentSession.id)
        .eq('user_id', user.id);
        
      setCurrentSession(prev => prev ? {...prev, actual_duration: actualDuration} : null);
    } catch (err) {
      console.error('Error updating session duration:', err);
    }
  }, [currentSession, user?.id]);

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

  // Tracking helpers
  const startSessionTracking = () => {
    // Update every 30 seconds
    if (!sessionInterval.current) {
      sessionInterval.current = setInterval(() => {
        updateSessionDuration();
      }, 30000); // 30 seconds
    }
  };
  
  const stopSessionTracking = () => {
    if (sessionInterval.current) {
      clearInterval(sessionInterval.current);
      sessionInterval.current = null;
    }
    sessionStartTime.current = null;
  };

  return {
    currentSession,
    recentSessions,
    stats,
    loading,
    error,
    startSession,
    endSession,
    endAllActiveSessions,
    fetchRecentSessions,
    fetchSessionStats,
    checkForActiveSession
  };
};