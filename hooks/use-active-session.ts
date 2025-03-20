import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ActiveFocusSessions } from '@/types/focus-session.types';

export function useActiveSessions() {
  const supabase = createClient();
  const [activeSessions, setActiveSessions] = useState<ActiveFocusSessions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('active_focus_sessions')
        .select('*');

      if (fetchError) throw fetchError;
      
      setActiveSessions(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching active sessions:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchActiveSessions();
    
    // Subscribe to changes in focus_sessions table
    const subscription = supabase
      .channel('public:focus_sessions')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'focus_sessions',
      }, () => {
        // When any change occurs in focus_sessions table, update our data
        fetchActiveSessions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh data every minute as backup for subscription
  useEffect(() => {
    const interval = setInterval(fetchActiveSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  return { activeSessions, loading, error, refresh: fetchActiveSessions };
}