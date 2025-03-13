"use client";

import React, { useEffect, useState } from 'react';
import { RealtimeEditor } from './RealtimeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar, Book } from 'lucide-react';
import DateRadioGroup from './date-radio-group';
import { useNotes } from '@/hooks/use-notes';
import { JSONContent } from 'novel';
import { ProjectNote } from '@/lib/project';
import CreateProjectDialog from '../create-project-dialog';
import { Card } from '@/components/ui/card';

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
    console.log('Renaming project', id, 'to', newTitle);
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
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] overflow-y-auto'
    >
      <div className="space-y-6 max-w-screen-lg mx-auto px-2 w-full">
        <div className="flex-shrink-0 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 shadow-md">
            <div className="flex flex-row items-center justify-between w-full">
              {/* Header Title and Description */}
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full sm:block hidden">
                  {activeTab === 'daily' ? (
                    <Calendar className="h-5 w-5 text-white" />
                  ) : (
                    <Book className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Notes</h2>
                  <p className="text-xs text-white opacity-90">
                    {activeTab === 'daily' ? 'Organize your thoughts by date' : 'Create and manage project pages'}
                  </p>
                </div>
              </div>

              {/* Tab Controls - Always visible */}
              <div className="flex-shrink-0">
                <TabsList className="bg-neutral-900/30 dark:bg-neutral-50/30">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white">
                    <Calendar className="h-4 w-4 mr-0 sm:mr-1" />
                    <span className="sm:block hidden">Daily Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="project" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-white">
                    <Book className="h-4 w-4 mr-0 sm:mr-1" />
                    <span className="sm:block hidden">Page Notes</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Daily Notes Selection - Shown only in daily tab */}
            {activeTab === 'daily' && (
              <div className="mt-3 bg-white bg-opacity-10 rounded-lg p-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <p className="text-white text-sm whitespace-nowrap flex-shrink-0 sm:block hidden">Select date</p>

                  <div className="flex items-center gap-2 overflow-x-auto max-w-full w-full">
                    <Button
                      className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 flex-shrink-0"
                      variant="ghost"
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
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </Button>

                    <DateRadioGroup
                      selectedDate={selectedDate}
                      days={days}
                      isOverflowing={isOverflowing}
                      isPending={loading}
                      onChangeDate={handleDateChange}
                    />

                    <Button
                      className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 flex-shrink-0"
                      variant="ghost"
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
                      <ChevronRight className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Project Pages Selection - Shown only in project tab */}
            {activeTab === 'project' && (
              <div className="mt-3 bg-white bg-opacity-10 rounded-lg p-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <p className="text-white text-sm whitespace-nowrap flex-shrink-0 sm:block hidden">Your pages</p>
                  <div className="flex gap-2 overflow-x-auto max-w-full w-full flex-row">
                    {projectNotes.length === 0 ? (
                      <span className="text-white text-sm opacity-80">No pages yet. Create your first one!</span>
                    ) : (
                      <div className="flex flex-grow w-full gap-2">
                        {projectNotes.map((project) => (
                          <Button
                            key={project.id}
                            variant="ghost"
                            className={`rounded-md border px-3 py-1 text-sm transition-colors text-center truncate shrink-0
                      ${selectedProject?.id === project.id
                                ? "bg-white text-indigo-600 border-transparent"
                                : "bg-transparent text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20"}
                      min-w-0`}
                            onClick={() => handleProjectSwitch(project)}
                          >
                            {project.title || "Untitled"}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-auto">
                    <CreateProjectDialog onCreateProject={async (title) => {
                      await createProjectNote(title);
                      await fetchAllProjectNotes();
                      setSelectedProject(null);
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <TabsContent
          value="daily"
          className="flex flex-col h-full"
          style={{ display: activeTab === 'daily' ? 'flex' : 'none' }}
        >
          {/* Remove the date navigation from here, as it's now in the header */}
          <Card className="flex-grow h-full shadow-md bg-neutral-50 dark:bg-neutral-900">
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
          </Card>
        </TabsContent>

        <TabsContent
          value="project"
          className="flex flex-col h-full"
          style={{ display: activeTab === 'project' ? 'flex' : 'none' }}
        >
          {/* Remove the project selection from here, as it's now in the header */}
          <Card className="flex-grow overflow-y-auto h-full shadow-md bg-neutral-50 dark:bg-neutral-900">
            {selectedProject && (
              <RealtimeEditor
                key={`project-${selectedProject.id}`}
                tableName="user_projects_notes"
                rowId={selectedProject.id}
                initalLastSaved={selectedProject.updated_at ? new Date(selectedProject.updated_at) : undefined}
                initialContent={selectedProject.content as JSONContent}
                handleDeleteProject={handleDeleteProject}
                handleRenameProject={handleRenameProject}
                selectedProject={selectedProject}
                onContentUpdate={(content) => {
                  setContentEditor(content);
                }}
              />
            )}
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
}