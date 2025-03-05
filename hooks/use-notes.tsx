import { useState, useEffect, useCallback, useRef } from 'react';
import { JSONContent } from "novel";
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

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
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [editorInitialValue, setEditorInitialValue] = useState<JSONContent | null | undefined>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref to track the previous content for comparison
    const previousContentRef = useRef<JSONContent | null>(null);
    const previousDateRef = useRef<string | null>(null);

    // Format date consistently
    const formatDate = useCallback((date: Date) => {
        return date.toISOString().split('T')[0];
    }, []);

    // Save notes for a specific date
    const saveNotes = useCallback(async (date: Date, content: JSONContent) => {
        if (!user) return false;

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
                .upsert({
                    user_id: user.id,
                    date: formattedDate,
                    content: content,
                    updated_at: new Date().toISOString()
                })
                .select();

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
        }
    }, [user, formatDate]);

    // Fetch notes for a specific date
    const fetchNotes = useCallback(async (date: Date) => {
        if (!user) {
            setEditorInitialValue(null);
            setLoading(false);
            return null;
        }

        try {
            setLoading(true);
            const formattedDate = formatDate(date);

            // Try to fetch the existing note for this date
            const { data, error } = await supabase
                .from('user_daily_notes')
                .select('content')
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

                setEditorInitialValue(firstLoginEditorContent);
            } else if (data) {
                // Existing note found
                setEditorInitialValue(data.content as JSONContent);
            } else {
                setEditorInitialValue(defaultEditorContent);
            }

            previousContentRef.current = data?.content || defaultEditorContent;
            previousDateRef.current = formattedDate;
            setError(null);
            return data?.content || defaultEditorContent;
        } catch (err) {
            console.error('Error fetching or creating notes:', err);
            setError('Failed to load notes');
            toast.error('Failed to load notes');
            setEditorInitialValue(defaultEditorContent);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user, formatDate]);

    // Change date with saving previous note
    const changeDate = useCallback(async (newDate: Date, currentContent: JSONContent) => {
        if (!user) return;

        try {
            // Save the current note before changing date
            const currentDateFormatted = formatDate(selectedDate);
            await saveNotes(selectedDate, currentContent);

            // Fetch notes for the new date
            await fetchNotes(newDate);

            // Update selected date
            setSelectedDate(newDate);
        } catch (err) {
            console.error('Error changing date:', err);
            toast.error('Failed to change date');
        }
    }, [user, selectedDate, formatDate, saveNotes, fetchNotes]);

    // Initial notes fetch when component mounts
    useEffect(() => {
        fetchNotes(selectedDate);
    }, [fetchNotes, selectedDate]);

    return {
        selectedDate,
        editorInitialValue,
        loading,
        error,
        changeDate,
        saveNotes,
        fetchNotes
    };
}