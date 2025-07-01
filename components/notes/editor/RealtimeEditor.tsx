"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandList,
  EditorCommandItem,
  JSONContent,
  type EditorInstance,
} from "novel";
import { handleCommandNavigation, ImageResizer } from "novel";
import { handleImagePaste, handleImageDrop, } from "novel";
import { Separator } from "@/components/ui/separator";
import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { ColorSelector } from "./selectors/color-selector";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import { uploadFn } from "./image-upload";
import { defaultExtensions } from './extensions';
import { createClient } from '@/utils/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { formatRelativeTime } from '@/lib/utils';
import { Book, Calendar, ChevronLeft, ChevronRight, Plus, CalendarDays, Search, Trash2, Trash, ChevronDown, Check, X, PlusCircle, Pencil } from 'lucide-react';
import { ProjectNote } from '@/lib/project';
import GenerativeMenuSwitch from './generative/generative-menu-switch';
import { MathSelector } from './selectors/math-selector';
import { EventSelector } from './selectors/event-selector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import './realtime-editor.css';

const extensions = [...defaultExtensions, slashCommand];

interface RealtimeEditorProps {
  tableName: 'user_daily_notes' | 'user_projects_notes';
  rowId: string | number;
  initialContent?: JSONContent;
  initalLastSaved?: Date;
  selectedProject?: ProjectNote;
  handleRenameProject?: (id: number, newTitle: string) => Promise<void>;
  handleDeleteProject?: (id: number) => Promise<void>;
  onContentUpdate?: (content: JSONContent) => void;
  activeTab?: 'daily' | 'project';
  onTabChange?: (tab: 'daily' | 'project') => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  projectNotes?: ProjectNote[];
  onProjectSelect?: (project: ProjectNote) => void;
  onCreateProject?: (title: string) => Promise<void>;
  days?: Date[];
  onDaysChange?: (days: Date[]) => void;
  disabled?: boolean;
}

export const RealtimeEditor: React.FC<RealtimeEditorProps> = ({
  tableName,
  rowId,
  initialContent = {},
  initalLastSaved,
  selectedProject,
  handleRenameProject,
  handleDeleteProject,
  onContentUpdate,
  // New props with defaults
  activeTab = 'daily',
  onTabChange,
  selectedDate = new Date(),
  onDateChange,
  projectNotes = [],
  onProjectSelect,
  onCreateProject,
  days = [],
  onDaysChange,
  disabled = false
}) => {
  const supabase = createClient();

  // Helper function to get user's local time from UTC
  const getLocalTimeFromUTC = useCallback((utcDate: Date): Date => {
    // Create a new date in the user's local timezone
    const localDate = new Date(utcDate.getTime());
    return localDate;
  }, []);

  // Helper function to format relative time with proper timezone handling
  const formatLocalRelativeTime = useCallback((date: Date): string => {
    const localDate = getLocalTimeFromUTC(date);
    return formatRelativeTime(localDate);
  }, [getLocalTimeFromUTC]);

  const [content, setContent] = useState<JSONContent>(initialContent);
  const [localContent, setLocalContent] = useState<JSONContent>(initialContent);
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const [openEvent, setOpenEvent] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');

  // Inline action states
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [renameProjectTitle, setRenameProjectTitle] = useState('');
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(
    initalLastSaved ? getLocalTimeFromUTC(initalLastSaved) : undefined
  );
  const editorRef = useRef<EditorInstance | null>(null);
  const prevRowIdRef = useRef<string | number>(rowId);
  const prevInitialContentRef = useRef<JSONContent>(initialContent);
  const debouncedContent = useDebounce(localContent, 2000);

  // Ensure days array is centered around selected date
  useEffect(() => {
    if (onDaysChange && selectedDate) {
      const selectedIndex = days.findIndex(d => d.toDateString() === selectedDate.toDateString());

      // If days array is empty, or selected date is not found, or not properly centered
      if (days.length === 0 || selectedIndex === -1 || selectedIndex !== Math.floor(days.length / 2)) {
        // Generate days array centered around selectedDate
        const numberOfDays = Math.max(7, days.length || 7); // Default to 7 days or maintain current length
        const middleIndex = Math.floor(numberOfDays / 2);
        const newDays = Array.from({ length: numberOfDays }, (_, i) => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() + (i - middleIndex));
          return newDate;
        });
        onDaysChange(newDays);
      }
    }
  }, [selectedDate, days, onDaysChange]);

  // Update content when initialContent prop changes or rowId changes
  useEffect(() => {
    const contentChanged = JSON.stringify(initialContent) !== JSON.stringify(prevInitialContentRef.current);
    const rowIdChanged = rowId !== prevRowIdRef.current;

    if (contentChanged || rowIdChanged) {
      setContent(initialContent);
      setLocalContent(initialContent);
      prevInitialContentRef.current = initialContent;
      prevRowIdRef.current = rowId;

      // If we have a reference to the editor, update its content
      if (editorRef.current) {
        editorRef.current.commands.setContent(initialContent);
      }
    }
  }, [initialContent, rowId]);

  // Sync with Supabase when the debounced content changes
  useEffect(() => {
    const syncWithSupabase = async () => {
      // Skip initial render or if content hasn't actually changed
      if (JSON.stringify(debouncedContent) === JSON.stringify(content)) {
        return;
      }

      try {
        setIsSaving(true);

        const { error } = await supabase
          .from(tableName)
          .update({
            content: debouncedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rowId);

        if (error) {
          console.error(`Error updating ${tableName}:`, error);
        } else {
          setContent(debouncedContent);
          // Store the current local time for proper timezone display
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error(`Error in syncWithSupabase:`, error);
      } finally {
        setIsSaving(false);
      }
    };

    syncWithSupabase();
  }, [debouncedContent, supabase, tableName, rowId, onContentUpdate, content]);

  // Handle content update locally without immediate sync
  const handleContentUpdate = useCallback((editor: EditorInstance) => {
    // Save a reference to the editor
    if (!editorRef.current) {
      editorRef.current = editor;
    }

    const newContent = editor.getJSON();
    setLocalContent(newContent);
    onContentUpdate?.(newContent);
  }, []);

  // Inline action handlers
  const handleInlineCreateProject = async () => {
    if (!newProjectTitle.trim() || !onCreateProject) return;

    setIsProcessing(true);
    try {
      await onCreateProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setIsCreatingProject(false);
    } catch (error) {
      console.error('Project creation failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInlineRenameProject = async () => {
    if (!newProjectTitle.trim() || !selectedProject || !handleRenameProject || newProjectTitle === selectedProject.title) return;

    setIsProcessing(true);
    try {
      await handleRenameProject(selectedProject.id, newProjectTitle.trim());
      setNewProjectTitle('');
      setIsRenamingProject(false);
    } catch (error) {
      console.error('Project rename failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInlineDeleteProject = async () => {
    if (!selectedProject || !handleDeleteProject) return;

    setIsProcessing(true);
    try {
      await handleDeleteProject(selectedProject.id);
      setIsDeletingProject(false);
    } catch (error) {
      console.error('Project deletion failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAllActions = () => {
    setIsCreatingProject(false);
    setIsRenamingProject(false);
    setIsDeletingProject(false);
    setNewProjectTitle('');
  };

  // Handle keyboard events for inline editing
  const handleKeyDown = (e: React.KeyboardEvent, action: 'create' | 'rename') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'create') {
        handleInlineCreateProject();
      } else if (action === 'rename') {
        handleInlineRenameProject();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelAllActions();
    }
  };

  return (
    <EditorRoot>
      <div className="flex flex-col w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-3xl border border-gray-200 dark:border-gray-700 relative">
        {/* Fixed Header */}
        {onTabChange && (
          <div className="border-b border-gray-200 dark:border-gray-700 header-gradient shadow-lg flex-shrink-0">
            {/* Unified Header with Tab Selection */}
            <div className="px-3 sm:px-4 py-2 sm:py-4">
              <div className="flex flex-col lg:flex-row lg:items-start gap-2 sm:gap-4">
                {/* Mobile: Compact dropdown layout */}
                <div className="flex sm:hidden items-center justify-between w-full gap-2">
                  {/* Left side: Tab dropdown selector - compact */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          disabled={disabled}
                          className={`flex items-center px-2 py-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 gap-1 min-w-0 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          {activeTab === 'daily' ? (
                            <>
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Daily</span>
                            </>
                          ) : (
                            <>
                              <Book className="h-3 w-3 flex-shrink-0" />
                              <span>Pages</span>
                            </>
                          )}
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-32 bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 shadow-xl" align="start">
                        <DropdownMenuItem
                          onClick={() => !disabled && onTabChange('daily')}
                          className={`flex items-center p-2 cursor-pointer ${activeTab === 'daily'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          <span className="text-xs">Daily Notes</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => !disabled && onTabChange('project')}
                          className={`flex items-center p-2 cursor-pointer ${activeTab === 'project'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          <Book className="h-3 w-3 mr-2" />
                          <span className="text-xs">Pages</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Right side: Action buttons - compact with icons only */}
                  {activeTab === 'daily' && onDateChange && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {selectedDate.toDateString() !== new Date().toDateString() && (
                        <button
                          disabled={disabled}
                          className={`flex items-center justify-center p-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                          onClick={() => {
                            if (!disabled) {
                              const today = new Date();
                              onDateChange(today);
                              if (onDaysChange) {
                                const numberOfDays = days.length;
                                const middleIndex = Math.floor(numberOfDays / 2);
                                const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                  const newDate = new Date(today);
                                  newDate.setDate(newDate.getDate() + (i - middleIndex));
                                  return newDate;
                                });
                                onDaysChange(newDays);
                              }
                            }
                          }}
                          title="Go to today's notes"
                        >
                          <Calendar className="h-3 w-3" />
                        </button>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            disabled={disabled}
                            className={`flex items-center justify-center p-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            title="Pick a specific date"
                          >
                            <CalendarDays className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date && onDateChange && !disabled) {
                                onDateChange(date);
                                if (onDaysChange) {
                                  const numberOfDays = days.length;
                                  const middleIndex = Math.floor(numberOfDays / 2);
                                  const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                    const newDate = new Date(date);
                                    newDate.setDate(newDate.getDate() + (i - middleIndex));
                                    return newDate;
                                  });
                                  onDaysChange(newDays);
                                }
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {activeTab === 'project' && onCreateProject && projectNotes.length === 0 && !isCreatingProject && (
                    <div className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => {
                          setIsCreatingProject(true);
                          setNewProjectTitle('');
                        }}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-1.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Create new page"
                      >
                        <PlusCircle className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {activeTab === 'project' && selectedProject && handleRenameProject && handleDeleteProject && !isRenamingProject && !isDeletingProject && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setIsRenamingProject(true);
                          setNewProjectTitle(selectedProject.title);
                        }}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-1.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Rename page"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setIsDeletingProject(true)}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-1.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Delete page"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile: Inline editing forms */}
                {activeTab === 'project' && (isCreatingProject || isRenamingProject || isDeletingProject) && (
                  <div className="flex sm:hidden mt-2 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                    {isCreatingProject && (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs text-white/80 font-medium">Create New Page</div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'create')}
                            placeholder="Page title..."
                            disabled={isProcessing}
                            className="flex-1 h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            autoFocus
                          />
                          <button
                            onClick={handleInlineCreateProject}
                            disabled={!newProjectTitle.trim() || isProcessing}
                            className="flex items-center justify-center p-1.5 rounded-md bg-white/30 text-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Confirm"
                          >
                            {isProcessing ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={cancelAllActions}
                            disabled={isProcessing}
                            className="flex items-center justify-center p-1.5 rounded-md bg-white/20 text-white/80 hover:bg-white/30 disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isRenamingProject && selectedProject && (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs text-white/80 font-medium">Rename Page</div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'rename')}
                            disabled={isProcessing}
                            className="flex-1 h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            autoFocus
                          />
                          <button
                            onClick={handleInlineRenameProject}
                            disabled={!newProjectTitle.trim() || newProjectTitle === selectedProject.title || isProcessing}
                            className="flex items-center justify-center p-1.5 rounded-md bg-white/30 text-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save changes"
                          >
                            {isProcessing ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={cancelAllActions}
                            disabled={isProcessing}
                            className="flex items-center justify-center p-1.5 rounded-md bg-white/20 text-white/80 hover:bg-white/30 disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {isDeletingProject && selectedProject && (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs text-white/80 font-medium">Delete Page</div>
                        <div className="text-xs text-white/60 mb-2">
                          Are you sure you want to delete "<span className="font-medium text-white/80">{selectedProject.title}</span>"?
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleInlineDeleteProject}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md bg-orange-100/20 text-orange-200 hover:bg-orange-100/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Confirm deletion"
                          >
                            {isProcessing ? (
                              <div className="w-3 h-3 border border-orange-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3" />
                                <span>Confirm</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelAllActions}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
                            title="Cancel deletion"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile: Date carousel navigation for daily notes */}
                {activeTab === 'daily' && onDateChange && days.length > 0 && (
                  <div className="flex sm:hidden items-center justify-center gap-1 mt-2">
                    <button
                      disabled={disabled}
                      className={`p-1 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-lg transition-all duration-200 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''
                        }`}
                      onClick={() => {
                        if (onDaysChange && !disabled) {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(newDate.getDate() - 1);
                          onDateChange(newDate);

                          // Center the new selected date in the days array
                          const numberOfDays = days.length;
                          const middleIndex = Math.floor(numberOfDays / 2);
                          const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                            const dayDate = new Date(newDate);
                            dayDate.setDate(dayDate.getDate() + (i - middleIndex));
                            return dayDate;
                          });
                          onDaysChange(newDays);
                        }
                      }}
                      title="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex flex-1 justify-center gap-1 px-1">
                      {(() => {
                        const selectedIndex = days.findIndex(d => d.toDateString() === selectedDate.toDateString());

                        // If selectedDate is not found in days array, default to middle
                        const safeSelectedIndex = selectedIndex !== -1 ? selectedIndex : Math.floor(days.length / 2);

                        // Calculate start and end indices to always show 3 days
                        let startIndex = Math.max(0, safeSelectedIndex - 1);
                        let endIndex = Math.min(days.length - 1, safeSelectedIndex + 1);

                        // Adjust if we're at the edges to ensure 3 days when possible
                        if (endIndex - startIndex < 2 && days.length >= 3) {
                          if (startIndex === 0) {
                            endIndex = Math.min(days.length - 1, startIndex + 2);
                          } else if (endIndex === days.length - 1) {
                            startIndex = Math.max(0, endIndex - 2);
                          }
                        }

                        // Get the 3 days to show
                        const mobileDays = days.slice(startIndex, endIndex + 1);

                        return mobileDays.map((day) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          const isSelected = day.toDateString() === selectedDate.toDateString();
                          const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNumber = day.getDate();
                          const month = day.toLocaleDateString('en-US', { month: 'short' });
                          const year = day.getFullYear().toString().slice(-2);

                          return (
                            <button
                              key={day.toISOString()}
                              disabled={disabled}
                              onClick={() => {
                                if (!disabled) {
                                  onDateChange(day);
                                  // Center the clicked date in the days array
                                  if (onDaysChange) {
                                    const numberOfDays = days.length;
                                    const middleIndex = Math.floor(numberOfDays / 2);
                                    const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                      const newDate = new Date(day);
                                      newDate.setDate(newDate.getDate() + (i - middleIndex));
                                      return newDate;
                                    });
                                    onDaysChange(newDays);
                                  }
                                }
                              }}
                              className={`date-carousel-item px-1 py-1.5 rounded-lg flex-1 min-w-[2.5rem] text-center relative transition-all duration-200 ${isSelected
                                ? 'bg-white text-blue-600 shadow-md font-medium'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/90 hover:bg-white/20'
                                } ${isToday && !isSelected ? 'ring-1 ring-yellow-400/50' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
                              title={`${dayOfWeek}, ${month} ${dayNumber}, ${day.getFullYear()}${isToday ? ' (Today)' : ''}`}
                            >
                              {isToday && (
                                <div className="text-xs font-medium leading-tight mb-0.5">Today</div>
                              )}
                              <div className="text-xs font-medium leading-tight">{dayOfWeek} {dayNumber}</div>
                              <div className="text-xs opacity-75 leading-tight">{month} {year}</div>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      disabled={disabled}
                      className={`p-1 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-lg transition-all duration-200 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''
                        }`}
                      onClick={() => {
                        if (onDaysChange && !disabled) {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(newDate.getDate() + 1);
                          onDateChange(newDate);

                          // Center the new selected date in the days array
                          const numberOfDays = days.length;
                          const middleIndex = Math.floor(numberOfDays / 2);
                          const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                            const dayDate = new Date(newDate);
                            dayDate.setDate(dayDate.getDate() + (i - middleIndex));
                            return dayDate;
                          });
                          onDaysChange(newDays);
                        }
                      }}
                      title="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Mobile: Project selector for project notes */}
                {activeTab === 'project' && onProjectSelect && projectNotes.length > 0 && (
                  <div className="flex sm:hidden mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          disabled={disabled}
                          className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 justify-between min-w-0 flex-1 ${disabled ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                          title={`Select a page to edit${selectedProject?.title ? ` - Currently: ${selectedProject.title}` : ''}`}
                        >
                          <span className="truncate text-left">
                            {selectedProject?.title || "Select a page"}
                          </span>
                          <ChevronLeft className="h-3 w-3 ml-2 rotate-[-90deg] flex-shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 shadow-xl" align="start">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search pages..."
                              value={projectSearchTerm}
                              onChange={(e) => !disabled && setProjectSearchTerm(e.target.value)}
                              disabled={disabled}
                              className="pl-10 text-sm"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {projectNotes
                            .filter(project =>
                              (project.title || "Untitled")
                                .toLowerCase()
                                .includes(projectSearchTerm.toLowerCase())
                            )
                            .map(project => (
                              <DropdownMenuItem
                                key={project.id}
                                onClick={() => {
                                  if (!disabled) {
                                    onProjectSelect(project);
                                    setProjectSearchTerm('');
                                  }
                                }}
                                className={`flex items-center p-3 cursor-pointer ${selectedProject?.id === project.id
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                              >
                                <Book className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span className="truncate">{project.title || "Untitled"}</span>
                              </DropdownMenuItem>
                            ))}
                          {projectNotes.filter(project =>
                            (project.title || "Untitled")
                              .toLowerCase()
                              .includes(projectSearchTerm.toLowerCase())
                          ).length === 0 && projectSearchTerm && (
                              <div className="p-3 text-sm text-gray-500 text-center">
                                No pages found
                              </div>
                            )}
                        </div>

                        {/* Add new page button at the bottom of dropdown */}
                        {onCreateProject && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                              onClick={() => {
                                if (!disabled) {
                                  setNewProjectTitle('');
                                  setIsCreatingProject(true);
                                }
                              }}
                              disabled={disabled}
                              className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              <Plus className="h-4 w-4" />
                              <span>Create New Page</span>
                            </button>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Desktop: Tab selection - vertical layout */}
                <div className="hidden sm:flex items-center justify-center lg:justify-start flex-shrink-0">
                  <div className="tab-container-vertical flex flex-row lg:flex-col">
                    <button
                      onClick={() => !disabled && onTabChange('daily')}
                      disabled={disabled}
                      className={`tab-button-vertical flex items-center px-3 sm:px-4 py-2 text-sm font-medium transition-all ${activeTab === 'daily' ? 'active' : ''
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Daily Notes</span>
                      <span className="xs:hidden">Daily</span>
                    </button>
                    <button
                      onClick={() => !disabled && onTabChange('project')}
                      disabled={disabled}
                      className={`tab-button-vertical flex items-center px-3 sm:px-4 py-2 text-sm font-medium transition-all ${activeTab === 'project' ? 'active' : ''
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Book className="h-4 w-4 mr-2" />
                      <span>Pages</span>
                    </button>
                  </div>
                </div>

                {/* Navigation content - takes remaining space */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  {/* Daily Notes Navigation */}
                  {activeTab === 'daily' && onDateChange && days.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full">
                      {/* Date carousel navigation */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="navigation-label text-white/70 px-1">Daily Notes</span>
                        <div className={`flex items-center justify-center ${disabled ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-1 w-full">
                            <button
                              disabled={disabled}
                              className={`p-1 sm:p-2 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-lg transition-all duration-200 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''
                                }`}
                              onClick={() => {
                                if (onDaysChange && !disabled) {
                                  const newDate = new Date(selectedDate);
                                  newDate.setDate(newDate.getDate() - 1);
                                  onDateChange(newDate);

                                  // Center the new selected date in the days array
                                  const numberOfDays = days.length;
                                  const middleIndex = Math.floor(numberOfDays / 2);
                                  const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                    const dayDate = new Date(newDate);
                                    dayDate.setDate(dayDate.getDate() + (i - middleIndex));
                                    return dayDate;
                                  });
                                  onDaysChange(newDays);
                                }
                              }}
                              title="Previous day"
                            >
                              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            <div className="flex date-carousel-buttons flex-1 justify-center px-1">
                              {/* Desktop: Show 5 days with selected day in the middle (3rd position) */}
                              <div className="flex w-full justify-center gap-1">
                                {(() => {
                                  const selectedIndex = days.findIndex(d => d.toDateString() === selectedDate.toDateString());

                                  // If selectedDate is not found in days array, default to middle
                                  const safeSelectedIndex = selectedIndex !== -1 ? selectedIndex : Math.floor(days.length / 2);

                                  // Calculate start and end indices to show 5 days with selected in the middle
                                  let startIndex = Math.max(0, safeSelectedIndex - 2);
                                  let endIndex = Math.min(days.length - 1, safeSelectedIndex + 2);

                                  // Adjust if we're at the edges to ensure 5 days when possible
                                  if (endIndex - startIndex < 4 && days.length >= 5) {
                                    if (startIndex === 0) {
                                      endIndex = Math.min(days.length - 1, startIndex + 4);
                                    } else if (endIndex === days.length - 1) {
                                      startIndex = Math.max(0, endIndex - 4);
                                    }
                                  }

                                  // Get the 5 days to show
                                  const desktopDays = days.slice(startIndex, endIndex + 1);

                                  return desktopDays.map((day) => {
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    const isSelected = day.toDateString() === selectedDate.toDateString();
                                    const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' });
                                    const dayNumber = day.getDate();
                                    const month = day.toLocaleDateString('en-US', { month: 'short' });
                                    const year = day.getFullYear().toString().slice(-2);

                                    return (
                                      <button
                                        key={day.toISOString()}
                                        disabled={disabled}
                                        onClick={() => {
                                          if (!disabled) {
                                            onDateChange(day);
                                            // Center the clicked date in the days array
                                            if (onDaysChange) {
                                              const numberOfDays = days.length;
                                              const middleIndex = Math.floor(numberOfDays / 2);
                                              const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                                const newDate = new Date(day);
                                                newDate.setDate(newDate.getDate() + (i - middleIndex));
                                                return newDate;
                                              });
                                              onDaysChange(newDays);
                                            }
                                          }
                                        }}
                                        className={`date-carousel-item px-2 py-2 rounded-lg flex-1 min-w-[3.5rem] text-center relative transition-all duration-200 ${isSelected
                                          ? 'bg-white text-blue-600 shadow-md font-medium'
                                          : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/90 hover:bg-white/20'
                                          } ${isToday && !isSelected ? 'ring-2 ring-yellow-400/50' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
                                        title={`${dayOfWeek}, ${month} ${dayNumber}, ${day.getFullYear()}${isToday ? ' (Today)' : ''}`}
                                      >
                                        {isToday && (
                                          <div className="text-xs font-medium leading-tight mb-0.5">Today</div>
                                        )}
                                        <div className="text-xs font-medium leading-tight">{dayOfWeek} {dayNumber}</div>
                                        <div className="text-xs opacity-75 leading-tight">{month} {year}</div>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>

                            <button
                              disabled={disabled}
                              className={`p-1 sm:p-2 text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-lg transition-all duration-200 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''
                                }`}
                              onClick={() => {
                                if (onDaysChange && !disabled) {
                                  const newDate = new Date(selectedDate);
                                  newDate.setDate(newDate.getDate() + 1);
                                  onDateChange(newDate);

                                  // Center the new selected date in the days array
                                  const numberOfDays = days.length;
                                  const middleIndex = Math.floor(numberOfDays / 2);
                                  const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                    const dayDate = new Date(newDate);
                                    dayDate.setDate(dayDate.getDate() + (i - middleIndex));
                                    return dayDate;
                                  });
                                  onDaysChange(newDays);
                                }
                              }}
                              title="Next day"
                            >
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Date navigation actions - Pick Date and Today buttons */}
                      <div className="flex sm:flex-col gap-1 sm:gap-2 flex-shrink-0 pb-[1px] sm:w-[110px]">
                        {/* Today button or spacer - always reserve space on desktop */}
                        {selectedDate.toDateString() !== new Date().toDateString() ? (
                          <button
                            disabled={disabled}
                            className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 sm:w-full whitespace-nowrap ${disabled ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                            onClick={() => {
                              if (!disabled) {
                                const today = new Date();
                                onDateChange(today);
                                if (onDaysChange) {
                                  const numberOfDays = days.length;
                                  const middleIndex = Math.floor(numberOfDays / 2);
                                  const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                    const newDate = new Date(today);
                                    newDate.setDate(newDate.getDate() + (i - middleIndex));
                                    return newDate;
                                  });
                                  onDaysChange(newDays);
                                }
                              }
                            }}
                            title="Go to today's notes"
                          >
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">Today</span>
                          </button>
                        ) : (
                          <div className="hidden sm:block h-[36px]"></div>
                        )}

                        {/* Pick Date button - always in second position on desktop, first/alongside on mobile */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              disabled={disabled}
                              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 sm:w-full whitespace-nowrap ${disabled ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                              title="Pick a specific date"
                            >
                              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">Pick Date</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                if (date && onDateChange && !disabled) {
                                  onDateChange(date);
                                  if (onDaysChange) {
                                    const numberOfDays = days.length;
                                    const middleIndex = Math.floor(numberOfDays / 2);
                                    const newDays = Array.from({ length: numberOfDays }, (_, i) => {
                                      const newDate = new Date(date);
                                      newDate.setDate(newDate.getDate() + (i - middleIndex));
                                      return newDate;
                                    });
                                    onDaysChange(newDays);
                                  }
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {/* Pages Navigation */}
                  {activeTab === 'project' && onProjectSelect && (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full">
                      {/* Current page selector */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="navigation-label text-white/70 px-1">Current Page</span>
                        {projectNotes.length === 0 ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-sm text-white/70 font-medium px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                              No pages yet
                            </div>
                            {onCreateProject && !isCreatingProject && (
                              <button
                                onClick={() => {
                                  setIsCreatingProject(true);
                                  setNewProjectTitle('');
                                }}
                                disabled={disabled}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                <PlusCircle className="h-4 w-4" />
                                <span>Create Page</span>
                              </button>
                            )}
                            {isCreatingProject && (
                              <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                <Input
                                  value={newProjectTitle}
                                  onChange={(e) => setNewProjectTitle(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, 'create')}
                                  placeholder="Page title..."
                                  disabled={isProcessing}
                                  className="flex-1 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                  autoFocus
                                />
                                <button
                                  onClick={handleInlineCreateProject}
                                  disabled={!newProjectTitle.trim() || isProcessing}
                                  className="flex items-center justify-center p-1.5 rounded-md bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Confirm"
                                >
                                  {isProcessing ? (
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={cancelAllActions}
                                  disabled={isProcessing}
                                  className="flex items-center justify-center p-1.5 rounded-md bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={disabled}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 justify-between min-w-0 ${disabled ? 'cursor-not-allowed opacity-50' : ''
                                  }`}
                                title={`Select a page to edit${selectedProject?.title ? ` - Currently: ${selectedProject.title}` : ''}`}
                              >
                                <span className="truncate text-left max-w-[200px] sm:max-w-[250px]">
                                  {selectedProject?.title || "Select a page"}
                                </span>
                                <ChevronLeft className="h-4 w-4 ml-2 rotate-[-90deg] flex-shrink-0" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-80 bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 shadow-xl" align="start">
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Search pages..."
                                    value={projectSearchTerm}
                                    onChange={(e) => !disabled && setProjectSearchTerm(e.target.value)}
                                    disabled={disabled}
                                    className="pl-10 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {projectNotes
                                  .filter(project =>
                                    (project.title || "Untitled")
                                      .toLowerCase()
                                      .includes(projectSearchTerm.toLowerCase())
                                  )
                                  .map(project => (
                                    <DropdownMenuItem
                                      key={project.id}
                                      onClick={() => {
                                        if (!disabled) {
                                          onProjectSelect(project);
                                          setProjectSearchTerm('');
                                        }
                                      }}
                                      className={`flex items-center p-3 cursor-pointer ${selectedProject?.id === project.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                      <Book className="h-4 w-4 mr-3 flex-shrink-0" />
                                      <span className="truncate">{project.title || "Untitled"}</span>
                                    </DropdownMenuItem>
                                  ))}
                                {projectNotes.filter(project =>
                                  (project.title || "Untitled")
                                    .toLowerCase()
                                    .includes(projectSearchTerm.toLowerCase())
                                ).length === 0 && projectSearchTerm && (
                                    <div className="p-3 text-sm text-gray-500 text-center">
                                      No pages found
                                    </div>
                                  )}
                              </div>

                              {/* Add new page button/form at the bottom of dropdown */}
                              {onCreateProject && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                                  {!isCreatingProject ? (
                                    <button
                                      onClick={() => {
                                        setIsCreatingProject(true);
                                        setNewProjectTitle('');
                                      }}
                                      disabled={disabled}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                                    >
                                      <PlusCircle className="h-4 w-4" />
                                      <span>Create New Page</span>
                                    </button>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Create New Page</div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={newProjectTitle}
                                          onChange={(e) => setNewProjectTitle(e.target.value)}
                                          onKeyDown={(e) => handleKeyDown(e, 'create')}
                                          placeholder="Page title..."
                                          disabled={isProcessing}
                                          className="flex-1 h-8 text-sm"
                                          autoFocus
                                        />
                                        <button
                                          onClick={handleInlineCreateProject}
                                          disabled={!newProjectTitle.trim() || isProcessing}
                                          className="flex items-center justify-center p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Confirm"
                                        >
                                          {isProcessing ? (
                                            <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </button>
                                        <button
                                          onClick={cancelAllActions}
                                          disabled={isProcessing}
                                          className="flex items-center justify-center p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                                          title="Cancel"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Page actions - rename and delete buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 pb-[1px]">
                        {selectedProject && handleRenameProject && handleDeleteProject && !isRenamingProject && !isDeletingProject && (
                          <>
                            <button
                              onClick={() => {
                                setIsRenamingProject(true);
                                setNewProjectTitle(selectedProject.title);
                              }}
                              disabled={disabled}
                              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              <Pencil className="h-4 w-4" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => setIsDeletingProject(true)}
                              disabled={disabled}
                              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              <Trash className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {isRenamingProject && selectedProject && (
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-white/70 font-medium whitespace-nowrap">Rename:</span>
                            <Input
                              value={newProjectTitle}
                              onChange={(e) => setNewProjectTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, 'rename')}
                              disabled={isProcessing}
                              className="w-48 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              autoFocus
                            />
                            <button
                              onClick={handleInlineRenameProject}
                              disabled={!newProjectTitle.trim() || newProjectTitle === selectedProject.title || isProcessing}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Save changes"
                            >
                              {isProcessing ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={cancelAllActions}
                              disabled={isProcessing}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {isDeletingProject && selectedProject && (
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-sm text-white/80">Delete "<span className="font-medium text-white">{selectedProject.title}</span>"?</span>
                            <button
                              onClick={handleInlineDeleteProject}
                              disabled={isProcessing}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Confirm deletion"
                            >
                              {isProcessing ? (
                                <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Trash className="h-3 w-3" />
                                  <span>Confirm</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={cancelAllActions}
                              disabled={isProcessing}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50"
                              title="Cancel deletion"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>)}

        {/* Scrollable Content Area */}
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Loading overlay */}
          {disabled && (
            <div className="absolute inset-0 bg-white/50 dark:bg-neutral-800/50 z-10 flex items-center justify-center backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Loading content...</span>
              </div>
            </div>
          )}

          <EditorContent
            className={`w-full break-words radius-lg flex-1 overflow-y-auto ${disabled ? 'pointer-events-none' : ''}`}
            extensions={extensions}
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => disabled ? true : handleCommandNavigation(event),
              },
              handlePaste: (view, event) => disabled ? true : handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => disabled ? true : handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full radius-lg ${disabled ? 'opacity-60' : ''}`,
              }
            }}
            initialContent={initialContent}
            onUpdate={({ editor }) => disabled ? undefined : handleContentUpdate(editor)}
            immediatelyRender={false}
            slotAfter={<ImageResizer />}
            onContentError={(error) => {
              console.error("Content error", error);
            }}
            editable={!disabled}
          >

            {/* Command Palette */}
            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
              <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
              <EditorCommandList>
                {suggestionItems.map((item) => (
                  <EditorCommandItem
                    value={item.title}
                    onCommand={(val) => item.command!(val)}
                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-200 dark:aria-selected:bg-gray-700"
                    key={item.title}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>

            <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
              {/* <Separator orientation="vertical" />
              <EventSelector open={openEvent} onOpenChange={setOpenEvent} /> */}
              <Separator orientation="vertical" />
              <NodeSelector open={openNode} onOpenChange={setOpenNode} />
              <Separator orientation="vertical" />
              <LinkSelector open={openLink} onOpenChange={setOpenLink} />
              <Separator orientation="vertical" />
              <MathSelector />
              <Separator orientation="vertical" />
              <TextButtons />
              <Separator orientation="vertical" />
              <ColorSelector open={openColor} onOpenChange={setOpenColor} />
            </GenerativeMenuSwitch>

          </EditorContent>
        </div>
      </div>
    </EditorRoot>
  );
};