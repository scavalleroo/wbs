"use client";

import React, { useEffect, useState } from 'react';
import { RealtimeEditor } from './RealtimeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Book } from 'lucide-react';
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

  // ...existing code...

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] overflow-y-auto'
    >
      <div className="space-y-0 max-w-screen-lg mx-auto px-2 w-full">
        {/* Selection Header Area */}
        <div className="flex-shrink-0 relative z-10">
          <div className="bg-gradient-to-b from-blue-500 via-indigo-600/80 to-transparent rounded-t-xl p-4 shadow-md relative">
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

            {/* Daily Notes Carousel Selection */}
            {activeTab === 'daily' && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm whitespace-nowrap flex-shrink-0 sm:block hidden">Select date</p>

                  <div className="carousel-container relative flex items-center justify-center gap-2 overflow-hidden w-auto px-8">
                    <Button
                      className="absolute left-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 z-10"
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

                    <div className="carousel-items flex items-center gap-2 overflow-x-auto w-auto py-4 px-2 scrollbar-hide">
                      {days.map((day) => {
                        const isSelected = day.toDateString() === selectedDate.toDateString();
                        return (
                          <Button
                            key={day.toISOString()}
                            onClick={() => handleDateChange(day)}
                            className={`transition-all duration-200 flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md font-medium
                              ${isSelected
                                ? 'bg-indigo-600 text-white dark:bg-white dark:text-indigo-600 scale-110 shadow-lg'
                                : 'bg-white/20 text-white hover:bg-white/30 dark:hover:bg-white/30 transform scale-90'
                              }`}
                          >
                            {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      className="absolute right-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 z-10"
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

            {/* Project Pages Carousel Selection */}
            {activeTab === 'project' && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm whitespace-nowrap flex-shrink-0 sm:block hidden">Your pages</p>

                  <div className="carousel-container relative flex items-center justify-center gap-2 overflow-hidden w-full pr-12">
                    <div className="carousel-items flex items-center gap-2 overflow-x-auto w-full py-4 px-2 scrollbar-hide">
                      {projectNotes.length === 0 ? (
                        <span className="text-white text-sm opacity-80">No pages yet. Create your first one!</span>
                      ) : (
                        projectNotes.map((project) => {
                          const isSelected = selectedProject?.id === project.id;
                          return (
                            <Button
                              key={project.id}
                              onClick={() => handleProjectSwitch(project)}
                              className={`transition-all duration-200 flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md font-medium
                                ${isSelected
                                  ? 'bg-indigo-600 text-white dark:bg-white dark:text-indigo-600 scale-110 shadow-lg'
                                  : 'bg-white/20 text-white hover:bg-white/30 dark:hover:bg-white/30 transform scale-90'
                                }`}
                            >
                              {project.title || "Untitled"}
                            </Button>
                          );
                        })
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-auto absolute right-0">
                      <CreateProjectDialog onCreateProject={async (title) => {
                        await createProjectNote(title);
                        await fetchAllProjectNotes();
                        setSelectedProject(null);
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Element - Creates visual flow from header to content */}
            {/* <div className="connector-element h-4 bg-gradient-to-b from-indigo-600 to-transparent -mb-4 rounded-b-xl z-20" /> */}
          </div>
        </div>

        {/* Editor Area with Connected Styling */}
        <div className="relative z-0 border-t-0 rounded-b-xl overflow-hidden">
          <TabsContent
            value="daily"
            className="flex flex-col h-full"
            style={{ display: activeTab === 'daily' ? 'flex' : 'none' }}
          >
            <Card className="flex-grow h-full shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-indigo-500 rounded-xl">
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
            <Card className="flex-grow overflow-y-auto h-full shadow-md bg-neutral-100 dark:bg-neutral-800 border-t-4 border-indigo-500 rounded-xl">
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
      </div>
    </Tabs>
  );
}