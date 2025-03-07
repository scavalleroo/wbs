import { useState, useCallback, useRef } from 'react';
import { JSONContent } from "novel";
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { DailyNote, ProjectNote } from '@/lib/project';
import { set } from 'react-hook-form';

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
    const [projectNote, setProjectNote] = useState<ProjectNote | null>(null);
    const [projectNotes, setProjectNotes] = useState<ProjectNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref to track the previous content for comparison
    const previousContentRef = useRef<JSONContent | null>(null);

    // Format date consistently
    const formatDate = useCallback((date: Date) => {
        return date.toISOString().split('T')[0];
    }, []);

    // Save notes for a specific date
    const saveDailyNotes = useCallback(async (date: Date, content: JSONContent, rowId: number) => {
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
    const fetchDailyNotes = useCallback(async (date: Date) => {
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


    // Fix existing saveProjectNotes function
    const saveProjectNotes = useCallback(async (title: string, content: JSONContent, rowId: number) => {
        if (!user) return false;

        setLoading(true);

        try {
            // Only save if content has changed
            if (
                JSON.stringify(content) === JSON.stringify(defaultEditorContent) ||
                JSON.stringify(content) === JSON.stringify(previousContentRef.current)
            ) {
                return false;
            }

            // Upsert the note
            const { error } = await supabase
                .from('user_projects_notes') // Fixed table name (plural)
                .update({
                    content: content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', rowId);

            if (error) {
                console.error('Error saving notes:', error);
                toast.error(`Failed to save notes for ${title}`);
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
    }, [user]);

    // Create fetchProjectNotes function by project ID
    const fetchProjectNotes = useCallback(async (projectId: number) => {
        if (!user) {
            setLoading(false);
            return null;
        }

        try {
            setLoading(true);

            // Try to fetch the existing project note by project ID (stored in title field)
            const { data, error } = await supabase
                .from('user_projects_notes')
                .select('*')
                .eq('user_id', user.id)
                .eq('id', projectId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No existing note, create a new one
                const { data: newNote, error: insertError } = await supabase
                    .from('user_projects_notes')
                    .insert({
                        user_id: user.id,
                        title: projectId,
                        content: defaultEditorContent,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (insertError) {
                    throw insertError;
                }

                previousContentRef.current = newNote?.content || defaultEditorContent;
                return {
                    content: newNote?.content || defaultEditorContent,
                    id: newNote?.id
                };
            } else if (data) {
                // Note exists, update ref and return
                previousContentRef.current = data.content;
                setProjectNote(data as ProjectNote);
            }

            setError(null);
            return data?.content || defaultEditorContent;
        } catch (err) {
            console.error('Error fetching or creating project notes:', err);
            setError('Failed to load project notes');
            toast.error('Failed to load project notes');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch all project notes for the user
    const fetchAllProjectNotes = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setProjectNotes([]);
            return [];
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('user_projects_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setProjectNotes(data as ProjectNote[]);
            setError(null);
            return data as ProjectNote[];
        } catch (err) {
            console.error('Error fetching project notes:', err);
            setError('Failed to load project notes');
            toast.error('Failed to load project notes');
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        dailyNote,
        projectNote,
        projectNotes,
        loading,
        error,
        saveDailyNotes,
        fetchDailyNotes,
        saveProjectNotes,
        fetchProjectNotes,
        fetchAllProjectNotes,
    };
}