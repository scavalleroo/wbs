import { Mood } from '@/types/mood.types';
import { UserIdParam } from '@/types/types';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const useMood = ({ user }: UserIdParam) => {
    const [mood, setMood] = useState<Mood | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const fetchInProgress = useRef(false);

    const fetchMood = useCallback(async () => {
        // Prevent concurrent fetches
        if (fetchInProgress.current) return null;

        try {
            fetchInProgress.current = true;
            setLoading(true);            
            if (!user?.id) {
                setMood(null);
                return null;
            }
            
            // Get today's date at midnight (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
    
            if (error && error.code !== 'PGRST116') throw error;
    
            if (data) {
                setMood(data);
            } else {
                setMood(null);
            }
            
            setError(null);
            return data;
        } catch (err) {
            console.error('Error fetching mood:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to load mood data');
            return null;
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [user?.id]);

    const hasMoodForToday = useCallback(async (): Promise<boolean> => {
        const todayMood = await fetchMood();
        return !!todayMood;
    }, [fetchMood]);

    const submitMood = useCallback(async (moodRating: number, description: string) => {
        if (!user?.id) {
            toast.error('You must be logged in to record mood');
            return null;
        }

        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id, 
                    mood_rating: moodRating, 
                    description: description || null,
                    created_at: new Date().toISOString()
                }])
                .select();
    
            if (error) throw error;
            
            // Update the local state directly with the new data
            if (data && data[0]) {
                setMood(data[0]);
                toast.success('Mood recorded successfully');
            }
            
            setError(null);
            return data?.[0] || null;
        } catch (err) {
            console.error("Insert error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to record mood');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const skipMood = useCallback(async () => {
        if (!user?.id) {
            toast.error('You must be logged in to skip mood recording');
            return null;
        }

        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id, 
                    mood_rating: null, 
                    description: null,
                    created_at: new Date().toISOString(),
                    skipped: true
                }])
                .select();
    
            if (error) throw error;
    
            // Update local state directly
            if (data && data[0]) {
                setMood(data[0]);
                toast.success('Mood tracking skipped for today');
            }
            
            setError(null);
            return data?.[0] || null;
        } catch (err) {
            console.error("Skip error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to skip mood recording');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Load mood data when user changes
    useEffect(() => {
        let isMounted = true;
        
        if (user?.id) {
            // Small delay to prevent rapid consecutive requests
            const timer = setTimeout(() => {
                if (isMounted) {
                    fetchMood();
                }
            }, 100);
            
            return () => {
                isMounted = false;
                clearTimeout(timer);
            };
        } else {
            setMood(null);
        }
    }, [user?.id, fetchMood]);

    return { 
        mood, 
        loading, 
        error, 
        fetchMood, 
        submitMood, 
        skipMood, 
        hasMoodForToday 
    };
};

export default useMood;