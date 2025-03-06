import { useState, useEffect, useCallback, useRef } from 'react';
import { JSONContent } from "novel";
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { DailyNote } from '@/lib/project';

// Supabase client setup
const supabase = createClient();

// Default content for new notes
const defaultEditorContent: JSONContent = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: []
        }
    ]
};

const firstLoginEditorContent: JSONContent = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [
                {
                    type: 'text',
                    text: 'Welcome to your daily notes!'
                }
            ]
        }
    ]
};

interface UseNotesParams {
    user: { id: string } | null | undefined;
}

export function useNotes({ user }: UseNotesParams) {
    const [dailyNote, setDailyNote] = useState<DailyNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref to track the previous content for comparison
    const previousContentRef = useRef<JSONContent | null>(null);

    // Format date consistently
    const formatDate = useCallback((date: Date) => {
        return date.toISOString().split('T')[0];
    }, []);

    // Save notes for a specific date
    const saveNotes = useCallback(async (date: Date, content: JSONContent, rowId: number) => {
        if (!user) return false;

        setLoading(true);

        try {
            const formattedDate = formatDate(date);

            // Only save if content has changed
            if (
                JSON.stringify(content) === JSON.stringify(defaultEditorContent) ||
                JSON.stringify(content) === JSON.stringify(previousContentRef.current)
            ) {
                return false;
            }

            // Upsert the note
            const { error } = await supabase
                .from('user_daily_notes')
                .update({
                    content: content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', rowId);

            if (error) {
                console.error('Error saving notes:', error);
                toast.error(`Failed to save notes for ${formattedDate}`);
                return false;
            }

            previousContentRef.current = content;
            return true;
        } catch (err) {
            console.error('Unexpected error saving notes:', err);
            toast.error('Unexpected error saving notes');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, formatDate]);

    // Fetch notes for a specific date
    const fetchNotes = useCallback(async (date: Date) => {
        if (!user) {
            setLoading(false);
            return null;
        }

        try {
            setLoading(true);
            const formattedDate = formatDate(date);

            // Try to fetch the existing note for this date
            const { data, error } = await supabase
                .from('user_daily_notes')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', formattedDate)
                .single();

            if (error && error.code === 'PGRST116') {
                // No existing note, create a new one
                await supabase
                    .from('user_daily_notes')
                    .insert({
                        user_id: user.id,
                        date: formattedDate,
                        content: firstLoginEditorContent,
                        created_at: new Date().toISOString()
                    });
            } else if (data) {
                setDailyNote(data as DailyNote);
            }

            previousContentRef.current = data?.content || defaultEditorContent;
            setError(null);
            return data?.content || defaultEditorContent;
        } catch (err) {
            console.error('Error fetching or creating notes:', err);
            setError('Failed to load notes');
            toast.error('Failed to load notes');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user, formatDate]);

    // Change date with saving previous note
    const changeDate = useCallback(async (newDate: Date, currentContent: JSONContent, rowId: number) => {
        if (!user) return;

        try {
            await fetchNotes(newDate);
        } catch (err) {
            console.error('Error changing date:', err);
            toast.error('Failed to change date');
        }
    }, [user, formatDate, saveNotes, fetchNotes]);

    return {
        dailyNote,
        loading,
        error,
        changeDate,
        saveNotes,
        fetchNotes
    };
}