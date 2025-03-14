import { supabase } from '@/lib/superbase';
import { Mood } from '@/types/mood.types';
import { useEffect, useState } from 'react';

interface UseMoodParams {
    user: { id: string } | null | undefined;
}

const useMood = ({ user }: UseMoodParams) => {
    const [mood, setMood] = useState<Mood | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMood = async () => {
        try {
            setLoading(true);            
            if (!user?.id) throw new Error("User not authenticated");
            
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
            }
            
            return data;
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            return null;
        } finally {
            setLoading(false);
        }
    };

    const hasMoodForToday = async (): Promise<boolean> => {
        const todayMood = await fetchMood();
        return !!todayMood;
    };

    const submitMood = async (moodRating: number, description: string) => {
        try {
            if (!user?.id) throw new Error("User not authenticated");
            
            const { data, error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id, 
                    mood_rating: moodRating, 
                    description: description || null,
                    created_at: new Date().toISOString()
                }])
                .select(); // Add this to get the inserted row back
    
            if (error) throw error;
            await fetchMood();
        } catch (error) {
            console.error("Insert error:", error);
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    // Apply the same session check to skipMood
    const skipMood = async () => {
        try {
            if (!user?.id) throw new Error("User not authenticated");
            
            const { error } = await supabase
                .from('mood_tracking')
                .insert([{ 
                    user_id: user.id, 
                    mood_rating: null, 
                    description: null,
                    created_at: new Date().toISOString(),
                    skipped: true
                }]);

            if (error) throw error;

            // Refresh mood data after skipping
            await fetchMood();
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    // Load mood data on initial component mount and when user changes
    useEffect(() => {
        if (user?.id) {
            fetchMood();
        }
    }, [user?.id]);

    return { mood, loading, error, fetchMood, submitMood, skipMood, hasMoodForToday };
};

export default useMood;