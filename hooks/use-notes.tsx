import { useState, useCallback, useRef } from 'react';
import { JSONContent } from "novel";
import { toast } from 'sonner';
import { DailyNote, ProjectNote } from '@/lib/project';
import { UserIdParam } from '@/types/types';
import { defaultEditorContent, dailyNewNote } from '@/utils/constants';
import { createClient } from '@/utils/supabase/client';

export function useNotes({ user }: UserIdParam) {
    const [dailyNote, setDailyNote] = useState<DailyNote | null>(null);
    const [projectNote, setProjectNote] = useState<ProjectNote | null>(null);
    const [projectNotes, setProjectNotes] = useState<ProjectNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

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

        // Reset state immediately when changing dates to prevent stale content
        setDailyNote(null);
        previousContentRef.current = null;

        try {
            setLoading(true);
            const formattedDate = formatDate(date);

            // Try to fetch the existing note for this date
            const { data, error } = await supabase
                .from('user_daily_notes')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', formattedDate)
                .maybeSingle();

            if (error) {
                console.error("Error fetching note:", error);
                throw error;
            }

            // If data exists, return it
            if (data) {
                setDailyNote(data as DailyNote);
                previousContentRef.current = JSON.parse(JSON.stringify(data.content));
                return data.content;
            } else {
                // Create a deep clone of the dailyNewNote to avoid reference issues
                const noteTemplate = JSON.parse(JSON.stringify(dailyNewNote));

                const { data: newNote, error: insertError } = await supabase
                    .from('user_daily_notes')
                    .insert({
                        user_id: user.id,
                        date: formattedDate,
                        content: noteTemplate,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error("Error creating new note:", insertError);
                    throw insertError;
                }

                setDailyNote(newNote as DailyNote);
                previousContentRef.current = noteTemplate;
                return noteTemplate;
            }

        } catch (err) {
            console.error('Error fetching or creating notes:', err);
            setError('Failed to load notes');
            toast.error('Failed to load notes');

            // Return a fresh copy of dailyNewNote as fallback
            const fallbackTemplate = JSON.parse(JSON.stringify(dailyNewNote));
            return fallbackTemplate;
        } finally {
            setLoading(false);
        }
    }, [user, formatDate]);


    // Fix existing saveProjectNotes function
    const saveProjectNotes = useCallback(async (
        projectId: number,
        options: { content?: JSONContent; title?: string }
    ) => {
        if (!user) return false;

        setLoading(true);

        try {
            const { content, title } = options;
            const updateData: Record<string, any> = {
                updated_at: new Date().toISOString(),
            };

            // Add content to update data if provided
            if (content) {
                // Only update content if it has changed
                if (
                    JSON.stringify(content) === JSON.stringify(defaultEditorContent) ||
                    JSON.stringify(content) === JSON.stringify(previousContentRef.current)
                ) {
                    // If we're only updating title, continue
                    if (!title) return false;
                } else {
                    updateData.content = content;
                    previousContentRef.current = content;
                }
            }

            // Add title to update data if provided
            if (title) {
                updateData.title = title;
            }

            // Don't proceed if there's nothing to update
            if (Object.keys(updateData).length === 1) return false; // Only updated_at exists

            // Update the note
            const { error } = await supabase
                .from('user_projects_notes')
                .update(updateData)
                .eq('id', projectId);

            if (error) {
                console.error('Error saving project note:', error);
                toast.error(`Failed to save project ${title ? `"${title}"` : ''}`);
                return false;
            }

            if (title) {
                toast.success(`Project renamed successfully`);
            }

            return true;
        } catch (err) {
            console.error('Unexpected error saving project note:', err);
            toast.error('Failed to update project');
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
                .order('updated_at', { ascending: false });

            if (error) {
                throw error;
            }

            // If no projects exist yet, create a default "Untitled project"
            if (!data || data.length === 0) {
                const newProject = await createProjectNote("Untitled project");
                if (newProject) {
                    return [newProject];
                }
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

    // Create a new project note
    const createProjectNote = useCallback(async (title: string) => {
        if (!user) {
            setLoading(false);
            return null;
        }

        try {
            setLoading(true);

            // Create a new project note
            const { data, error } = await supabase
                .from('user_projects_notes')
                .insert({
                    user_id: user.id,
                    title: title,
                    content: defaultEditorContent,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating project note:', error);
                toast.error(`Failed to create project "${title}"`);
                return null;
            }

            // Add the new note to the project notes list
            setProjectNotes(prev => [data as ProjectNote, ...prev]);

            setError(null);
            toast.success(`Project "${title}" created successfully`);
            return data as ProjectNote;
        } catch (err) {
            console.error('Unexpected error creating project note:', err);
            setError('Failed to create project note');
            toast.error('Unexpected error creating project note');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Delete a project note
    const deleteProjectNote = useCallback(async (noteId: number) => {
        if (!user) {
            setLoading(false);
            return false;
        }

        try {
            setLoading(true);

            // Delete the project note
            const { error } = await supabase
                .from('user_projects_notes')
                .delete()
                .eq('id', noteId)
                .eq('user_id', user.id); // Ensure users can only delete their own notes

            if (error) {
                console.error('Error deleting project note:', error);
                toast.error('Failed to delete project');
                return false;
            }

            // Remove the deleted note from the project notes list
            setProjectNotes(prev => prev.filter(note => note.id !== noteId));

            setError(null);
            toast.success('Project deleted successfully');
            return true;
        } catch (err) {
            console.error('Unexpected error deleting project note:', err);
            setError('Failed to delete project note');
            toast.error('Unexpected error deleting project note');
            return false;
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
        createProjectNote,
        deleteProjectNote,
    };
}