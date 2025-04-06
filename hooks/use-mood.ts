import { Mood, WellnessRatings } from '@/types/mood.types';
import { UserIdParam } from '@/types/types';
import { createClient } from '@/utils/supabase/client';
import { format, parseISO } from 'date-fns';
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

    const getMoodCalendarData = useCallback(async () => {
        if (!user?.id) return new Map();
        
        try {
            // Get data for the last 30 days
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - 30);
            
            const formattedStartDate = format(startDate, 'yyyy-MM-dd');
            const formattedEndDate = format(today, 'yyyy-MM-dd');
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .select('*')
                .eq('user_id', user.id)
                .gte('tracked_date', formattedStartDate)
                .lte('tracked_date', formattedEndDate)
                .order('tracked_date', { ascending: true });
            
            if (error) throw error;
            
            const calendarMap = new Map();
            
            // Initialize the map with empty data for all days
            for (let i = 0; i <= 30; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateString = format(date, 'yyyy-MM-dd');
                calendarMap.set(dateString, {
                    date,
                    mood_rating: null,
                    sleep_rating: null,
                    nutrition_rating: null,
                    exercise_rating: null,
                    social_rating: null,
                    description: null
                });
            }
            
            // Fill in the actual data
            if (data && data.length > 0) {
                data.forEach(entry => {
                    const dateString = entry.tracked_date;
                    
                    if (calendarMap.has(dateString)) {
                        calendarMap.set(dateString, {
                            date: new Date(dateString),
                            mood_rating: entry.mood_rating,
                            sleep_rating: entry.sleep_rating,
                            nutrition_rating: entry.nutrition_rating,
                            exercise_rating: entry.exercise_rating,
                            social_rating: entry.social_rating,
                            description: entry.description
                        });
                    }
                });
            }
            
            return calendarMap;
        } catch (err) {
            console.error('Error fetching mood calendar data:', err);
            setError(err instanceof Error ? err.message : String(err));
            toast.error('Failed to load wellbeing history');
            return new Map();
        }
    }, [user?.id]);

    return { 
        mood, 
        loading, 
        error, 
        fetchMood, 
        submitWellness,
        skipWellness, 
        hasWellnessForToday,
        getMoodHistory,
        getMoodCalendarData,
    };
};

export default useMood;