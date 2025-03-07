"use client";

import React, { useEffect, useState } from 'react';
import { RealtimeEditor } from './RealtimeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import DateRadioGroup from './date-radio-group';
import { useNotes } from '@/hooks/use-notes';
import { JSONContent } from 'novel';
import { ProjectNote } from '@/lib/project';
import CreateProjectDialog from '../create-project-dialog';

interface FocusTabsProps {
  user: User | null | undefined;
}

export const FocusTabs: React.FC<FocusTabsProps> = ({
  user
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'project'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<ProjectNote | null>(null);
  const [contentEditor, setContentEditor] = useState<JSONContent | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const [days, setDays] = useState<Date[]>(
    Array.from({ length: 7 }, (_, i) => {
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
        console.log("Saving project notes:", selectedProject.title);
        await saveProjectNotes(
          selectedProject.title || "Untitled Project",
          contentEditor,
          selectedProject.id
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
          selectedProject.title || "Untitled Project",
          contentEditor,
          selectedProject.id
        );
      }

      // After saving, fetch the new project
      await fetchProjectNotes(project.id);
    } catch (error) {
      console.error("Error switching projects:", error);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] max-w-screen-lg mx-auto sm:px-0 px-4'
    >
      <div className="flex-shrink-0 my-4"> {/* This wrapper prevents the header from scrolling */}
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="daily"
        className="flex flex-col h-full overflow-hidden" // Add overflow-hidden here
        style={{ display: activeTab === 'daily' ? 'flex' : 'none' }}
      >
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <Button
            className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
            variant="outline"
            onClick={() => {
              const newDays = days.map((day) => {
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() - 1);
                return newDate;
              });
              setDays(newDays);
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              handleDateChange(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DateRadioGroup
            selectedDate={selectedDate}
            days={days}
            isOverflowing={isOverflowing}
            isPending={loading}
            onChangeDate={handleDateChange} />
          <Button
            className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
            variant="outline"
            onClick={() => {
              const newDays = days.map((day) => {
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() + 1);
                return newDate;
              });
              setDays(newDays);
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              handleDateChange(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto h-full">
          {dailyNote && !loading && (
            <RealtimeEditor
              key={`daily-${dailyNote.id}`}
              tableName="user_daily_notes"
              rowId={dailyNote.id}
              initalLastSaved={dailyNote.updated_at ? new Date(dailyNote.updated_at) : undefined}
              initialContent={dailyNote.content as JSONContent}
              onContentUpdate={(content) => {
                setContentEditor(content);
              }}
            />
          )}
        </div>
      </TabsContent>

      <TabsContent
        value="project"
        className="flex flex-col h-full overflow-hidden" // Add overflow-hidden here
        style={{ display: activeTab === 'project' ? 'flex' : 'none' }}
      >
        <div className="flex-shrink-0 mb-4"> {/* Fixed position at top */}
          {projectNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center border rounded-md border-dashed">
              <p className="text-muted-foreground mb-2">No project notes available.</p>
              <p className="text-sm text-muted-foreground">Create a project to start taking notes.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="flex gap-2 overflow-x-auto">
                {projectNotes.map((project) => (
                  <Button
                    key={project.id}
                    variant="ghost"
                    className={`flex-1 min-h-10 flex flex-col items-center 
                      rounded-md border-2 border-muted bg-popover 
                      py-1 md:px-1 md:py-0.5 hover:bg-accent hover:text-accent-foreground 
                      cursor-pointer text-sm transition-colors duration-200
                      ${selectedProject?.id === project.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-transparent"}
                      whitespace-nowrap justify-center`}
                    onClick={() => handleProjectSwitch(project)}
                  >
                    <p className="text-xs">
                      {project.title || "Untitled Project"}
                    </p>
                  </Button>
                ))}
                <CreateProjectDialog onCreateProject={async (title) => {
                  await createProjectNote(title);
                  await fetchAllProjectNotes();
                  setSelectedProject(null);
                }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex-grow overflow-y-auto h-full">
          {selectedProject && (
            <RealtimeEditor
              key={`project-${selectedProject.id}`}
              tableName="user_projects_notes"
              rowId={selectedProject.id}
              initalLastSaved={selectedProject.updated_at ? new Date(selectedProject.updated_at) : undefined}
              initialContent={selectedProject.content as JSONContent}
              onContentUpdate={(content) => {
                setContentEditor(content);
              }}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};