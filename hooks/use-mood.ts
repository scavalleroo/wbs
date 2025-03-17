import { Mood, WellnessRatings } from '@/types/mood.types';
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
            toast.error('Failed to load wellness data');
            return null;
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [user?.id]);

    const hasWellnessForToday = useCallback(async (): Promise<boolean> => {
        const todayMood = await fetchMood();
        return !!todayMood;
    }, [fetchMood]);

    const submitWellness = useCallback(async (
        ratings: WellnessRatings, 
        description: string,
        date: Date = new Date() // Default to current date
    ) => {
        if (!user?.id) {
            toast.error('You must be logged in to record wellness data');
            return null;
        }
    
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id,
                    mood_rating: ratings.mood_rating,
                    sleep_rating: ratings.sleep_rating,
                    nutrition_rating: ratings.nutrition_rating,
                    exercise_rating: ratings.exercise_rating,
                    social_rating: ratings.social_rating,
                    description: description || null,
                    created_at: date.toISOString() // Use the provided date
                }])
                .select();
    
            if (error) throw error;
            
            // Update the local state directly with the new data
            if (data && data[0]) {
                setMood(data[0]);
                toast.success('Wellness data recorded successfully');
            }
            
            setError(null);
            return data?.[0] || null;
        } catch (err) {
            console.error("Insert error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to record wellness data');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const skipWellness = useCallback(async () => {
        if (!user?.id) {
            toast.error('You must be logged in to skip wellness tracking');
            return null;
        }

        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id, 
                    mood_rating: null,
                    sleep_rating: null,
                    nutrition_rating: null,
                    exercise_rating: null,
                    social_rating: null,
                    description: null,
                    created_at: new Date().toISOString(),
                    skipped: true
                }])
                .select();
    
            if (error) throw error;
    
            // Update local state directly
            if (data && data[0]) {
                setMood(data[0]);
                toast.success('Wellness tracking skipped for today');
            }
            
            setError(null);
            return data?.[0] || null;
        } catch (err) {
            console.error("Skip error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to skip wellness tracking');
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

    // Add this function to the useMood hook

    const getMoodHistory = useCallback(async (startDate: string, endDate: string) => {
        if (!user?.id) return [];
        
        try {
            const { data, error } = await supabase
                .from('mood_tracking')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
        } catch (err) {
            console.error('Error fetching mood history:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to load wellness history');
            return [];
        }
    }, [user?.id]);

    // Add getMoodHistory to the return object
    return { 
        mood, 
        loading, 
        error, 
        fetchMood, 
        submitWellness,
        skipWellness, 
        hasWellnessForToday,
        getMoodHistory
    };
};

export default useMood;