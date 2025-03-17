import { Mood, WellnessRatings } from '@/types/mood.types';
import { UserIdParam } from '@/types/types';
import { createClient } from '@/utils/supabase/client';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
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
            
            // Get today's date in YYYY-MM-DD format
            const today = format(new Date(), 'yyyy-MM-dd');
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .select('*')
                .eq('user_id', user.id)
                .eq('tracked_date', today) // Use tracked_date instead of created_at
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
        date: Date = new Date() // Date the data refers to
    ) => {
        if (!user?.id) {
            toast.error('You must be logged in to record wellness data');
            return null;
        }

        try {
            setLoading(true);
            
            // Format the date for tracked_date (YYYY-MM-DD)
            const formattedDate = format(date, 'yyyy-MM-dd');
            
            // Check if an entry already exists for this date
            const { data: existingEntry, error: fetchError } = await supabase
                .from('mood_tracking')
                .select('id')
                .eq('user_id', user.id)
                .eq('tracked_date', formattedDate)
                .maybeSingle();
                
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
            
            let result;
            
            if (existingEntry) {
                // Update existing entry
                const { data, error } = await supabase
                    .from('mood_tracking')
                    .update({ 
                        mood_rating: ratings.mood_rating,
                        sleep_rating: ratings.sleep_rating,
                        nutrition_rating: ratings.nutrition_rating,
                        exercise_rating: ratings.exercise_rating,
                        social_rating: ratings.social_rating,
                        description: description || null,
                        updated_at: new Date().toISOString(),
                        skipped: false // Ensure it's not marked as skipped
                    })
                    .eq('id', existingEntry.id)
                    .select();
                    
                if (error) throw error;
                result = data;
                toast.success('Wellness data updated successfully');
            } else {
                // Insert new entry
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
                        tracked_date: formattedDate, // Use the new tracked_date field
                        skipped: false
                    }])
                    .select();
                    
                if (error) throw error;
                result = data;
                toast.success('Wellness data recorded successfully');
            }
            
            // Update the local state directly with the new data if it's for today
            if (result && result[0] && format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                setMood(result[0]);
            }
            
            setError(null);
            return result?.[0] || null;
        } catch (err) {
            console.error("Wellness data operation error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            toast.error('Failed to save wellness data');
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
            
            // Today's date in YYYY-MM-DD
            const today = format(new Date(), 'yyyy-MM-dd');
            
            // Check if an entry already exists for today
            const { data: existingEntry, error: fetchError } = await supabase
                .from('mood_tracking')
                .select('id')
                .eq('user_id', user.id)
                .eq('tracked_date', today)
                .maybeSingle();
                
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
            
            let result;
            
            if (existingEntry) {
                // Update existing entry to skipped
                const { data, error } = await supabase
                    .from('mood_tracking')
                    .update({ 
                        skipped: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingEntry.id)
                    .select();
                    
                if (error) throw error;
                result = data;
            } else {
                // Insert new skipped entry
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
                        tracked_date: today,
                        skipped: true
                    }])
                    .select();
        
                if (error) throw error;
                result = data;
            }
    
            // Update local state directly
            if (result && result[0]) {
                setMood(result[0]);
                toast.success('Wellness tracking skipped for today');
            }
            
            setError(null);
            return result?.[0] || null;
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

    const getMoodHistory = useCallback(async (startDate: string, endDate: string) => {
        if (!user?.id) return [];
        
        try {
            // Convert ISO dates to YYYY-MM-DD for tracked_date
            const start = format(parseISO(startDate), 'yyyy-MM-dd');
            const end = format(parseISO(endDate), 'yyyy-MM-dd');
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .select('*')
                .eq('user_id', user.id)
                .gte('tracked_date', start)
                .lte('tracked_date', end)
                .order('tracked_date', { ascending: true });
            
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
        submitWellness,
        skipWellness, 
        hasWellnessForToday,
        getMoodHistory
    };
};

export default useMood;