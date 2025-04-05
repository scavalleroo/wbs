"use client";

import React, { useEffect, useState } from 'react';
import { RealtimeEditor } from './editor/RealtimeEditor';
import { User } from '@supabase/supabase-js';
import { useNotes } from '@/hooks/use-notes';
import { JSONContent } from 'novel';
import { ProjectNote } from '@/lib/project';
import { Card } from '@/components/ui/card';

interface NotesPageComponentProps {
  user: User | null | undefined;
}

export const NotesPageComponent: React.FC<NotesPageComponentProps> = ({
  user
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'project'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<ProjectNote | null>(null);
  const [contentEditor, setContentEditor] = useState<JSONContent | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const nDays = 5;
  const [days, setDays] = useState<Date[]>(
    Array.from({ length: nDays }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 1 + i);
      return date;
    })
  );

  const {
    projectNotes,
    projectNote,
    dailyNote,
    loading,
    error,
    saveDailyNotes,
    saveProjectNotes,
    fetchDailyNotes,
    fetchProjectNotes,
    fetchAllProjectNotes,
    createProjectNote,
    deleteProjectNote,
  } = useNotes({ user });

  // Handle window resize for overflow detection
  useEffect(() => {
    const checkOverflow = () => {
      setIsOverflowing(window.innerWidth < 1024);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  // When dailyNote changes, update contentEditor
  useEffect(() => {
    if (dailyNote) {
      setContentEditor(dailyNote.content as JSONContent);
    }
  }, [dailyNote]);

  // When projectNote changes, update selectedProject
  useEffect(() => {
    if (projectNote) {
      setSelectedProject(projectNote);
      setContentEditor(projectNote.content as JSONContent);
    }
  }, [projectNote]);

  // Set default project when projectNotes loads
  useEffect(() => {
    const fetchProject = async () => {
      if (projectNotes.length > 0 && !selectedProject) {
        await fetchProjectNotes(projectNotes[0].id);
      }
    };

    fetchProject();
  }, [projectNotes, selectedProject]);

  // Load appropriate data when tab changes
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'project') {
        await fetchAllProjectNotes();
      } else if (activeTab === 'daily') {
        await fetchDailyNotes(selectedDate);
      }
    };

    fetchData();
  }, [activeTab]);

  // Handle date changes for daily notes
  useEffect(() => {
    fetchDailyNotes(selectedDate);
  }, [selectedDate]);

  // Save changes before changing tabs
  const handleTabChange = async (value: string) => {
    try {
      // Save current tab's content before switching
      if (activeTab === 'daily' && dailyNote && contentEditor) {
        await saveDailyNotes(selectedDate, contentEditor, dailyNote.id);
      } else if (activeTab === 'project' && selectedProject && contentEditor) {
        await saveProjectNotes(
          selectedProject.id,
          {
            title: selectedProject.title || "Untitled Project",
            content: contentEditor,
          }
        );
        setSelectedProject(null);
      } else {
        console.warn("No content to save before switching tabs:", activeTab);
      }

      // Then change the tab
      setActiveTab(value as 'daily' | 'project');
    } catch (error) {
      console.error("Error saving during tab change:", error);
      // Still change the tab even if saving fails
      setActiveTab(value as 'daily' | 'project');
    }
  };

  const handleDateChange = async (date: Date) => {
    // Only save if we have both a note and content
    if (dailyNote && contentEditor) {
      await saveDailyNotes(selectedDate, contentEditor, dailyNote.id);
    }
    setSelectedDate(date);
  };

  // Handle project switching
  const handleProjectSwitch = async (project: ProjectNote) => {
    try {
      // Only save current project if we have one selected and content to save
      if (selectedProject && contentEditor) {
        await saveProjectNotes(
          selectedProject.id,
          {
            title: selectedProject.title || "Untitled Project",
            content: contentEditor,
          }
        );
      }

      // After saving, fetch the new project
      await fetchProjectNotes(project.id);
    } catch (error) {
      console.error("Error switching projects:", error);
    }
  };

  const handleRenameProject = async (id: number, newTitle: string) => {
    await saveProjectNotes(id, { title: newTitle });
    await fetchAllProjectNotes();
    setSelectedProject(null);
  };

  const handleDeleteProject = async (id: number) => {
    await deleteProjectNote(id);
    await fetchAllProjectNotes();
    setSelectedProject(null);
  };

  return (
    <div className="w-full h-full py-2">
      <div className="max-w-screen-lg mx-auto w-full h-full">
        <Card className="rounded-lg bg-transparent text-card-foreground h-full overflow-auto border-none">
          {activeTab === 'daily' && dailyNote && !loading ? (
            <RealtimeEditor
              key={`daily-${dailyNote.id}`}
              tableName="user_daily_notes"
              rowId={dailyNote.id}
              initalLastSaved={dailyNote.updated_at ? new Date(dailyNote.updated_at) : undefined}
              initialContent={dailyNote.content as JSONContent}
              onContentUpdate={(content) => setContentEditor(content)}
              // Integrated header props
              activeTab={activeTab}
              onTabChange={handleTabChange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              days={days}
              onDaysChange={setDays}
            />
          ) : activeTab === 'project' && selectedProject ? (
            // In the activeTab === 'project' render section:
            <RealtimeEditor
              key={`project-${selectedProject.id}`}
              tableName="user_projects_notes"
              rowId={selectedProject.id}
              initalLastSaved={selectedProject.updated_at ? new Date(selectedProject.updated_at) : undefined}
              initialContent={selectedProject.content as JSONContent}
              handleDeleteProject={handleDeleteProject}
              handleRenameProject={handleRenameProject}
              selectedProject={selectedProject}
              onContentUpdate={(content) => setContentEditor(content)}
              // Integrated header props
              activeTab={activeTab}
              onTabChange={handleTabChange}
              projectNotes={projectNotes}
              onProjectSelect={handleProjectSwitch}
              onCreateProject={(title) => {
                return createProjectNote(title)
                  .then(() => fetchAllProjectNotes())
                  .then(() => { }) // Explicitly return void to fix type error
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}