// src/hooks/use-projects.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { JSONContent } from 'novel';
import { toast } from 'sonner';
import { ProjectNote } from '@/lib/project';

const supabase = createClient();

const defaultProjectNoteContent: JSONContent = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: []
        }
    ]
};

export function useProjects(user: { id: string } | null | undefined) {
    const [projects, setProjects] = useState<ProjectNote[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectNote | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user's project notes
    const fetchProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_projects_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setProjects(data || []);
        } catch (err) {
            console.error('Error fetching projects:', err);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Create a new project note
    const createProject = useCallback(async (title: string) => {
        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from('user_projects_notes')
                .insert({
                    user_id: user.id,
                    title,
                    content: defaultProjectNoteContent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Refresh projects list
            await fetchProjects();

            return data;
        } catch (err) {
            console.error('Error creating project:', err);
            toast.error('Failed to create project');
            return null;
        }
    }, [user, fetchProjects]);

    // Save project note
    const saveProjectNote = useCallback(async (project: ProjectNote, content: JSONContent) => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('user_projects_notes')
                .update({
                    content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', project.id)
                .eq('user_id', user.id);

            if (error) throw error;

            // Update local state
            setProjects(prevProjects =>
                prevProjects.map(p =>
                    p.id === project.id
                        ? { ...p, content, updated_at: new Date().toISOString() }
                        : p
                )
            );

            return true;
        } catch (err) {
            console.error('Error saving project note:', err);
            toast.error('Failed to save project note');
            return false;
        }
    }, [user]);

    // Select a project 
    const selectProject = useCallback((project: ProjectNote) => {
        setSelectedProject(project);
    }, []);

    // Initial projects fetch
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        selectedProject,
        loading,
        createProject,
        selectProject,
        saveProjectNote,
        fetchProjects
    };
}