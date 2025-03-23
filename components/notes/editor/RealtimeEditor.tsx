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
import ProjectDialogs from './project-dialogs';
import { ProjectNote } from '@/lib/project';
import GenerativeMenuSwitch from './generative/generative-menu-switch';
import { MathSelector } from './selectors/math-selector';
import { EventSelector } from './selectors/event-selector';
import { formatRelativeTime } from '@/lib/utils';
import { Book, Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import CreateProjectDialog from '../create-project-dialog';

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
  onDaysChange
}) => {
  const supabase = createClient();
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [localContent, setLocalContent] = useState<JSONContent>(initialContent);
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const [openEvent, setOpenEvent] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(initalLastSaved);
  const editorRef = useRef<EditorInstance | null>(null);
  const prevRowIdRef = useRef<string | number>(rowId);
  const prevInitialContentRef = useRef<JSONContent>(initialContent);


  // Create a debounced version of the content
  const debouncedContent = useDebounce(localContent, 2000);

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

  return (
    <EditorRoot>
      <div className="flex flex-col w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 relative">
        {/* Sticky Integrated Header */}
        {/* Sticky Integrated Header */}
        {onTabChange && (
          <div
            className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 shadow-md"
          >
            {/* Tab Navigation - Clear tab-like design */}
            {/* Tab Navigation with consistent styling */}
            <div className="px-2 pt-2"> {/* Removed border-b border-white/10 */}
              <div className="flex justify-between items-center">
                {/* Tab Buttons with consistent styling and border radius */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onTabChange('daily')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'daily'
                      ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 font-medium shadow-sm'
                      : 'bg-blue-600/50 text-white/90 hover:bg-blue-600/70'
                      }`}
                  >
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      <span>Diary</span>
                    </span>
                  </button>
                  <button
                    onClick={() => onTabChange('project')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === 'project'
                      ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 font-medium shadow-sm'
                      : 'bg-blue-600/50 text-white/90 hover:bg-blue-600/70'
                      }`}
                  >
                    <span className="flex items-center">
                      <Book className="h-3.5 w-3.5 mr-1.5" />
                      <span>Pages</span>
                    </span>
                  </button>
                </div>

                {/* Always visible create project button when in project tab */}
                {activeTab === 'project' && onCreateProject && (
                  <div className="flex-shrink-0">
                    <CreateProjectDialog onCreateProject={onCreateProject} />
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Content Area - Improved scrolling */}
            <div className="p-1.5 flex items-center">
              {/* Daily content */}
              {activeTab === 'daily' && onDateChange && days.length > 0 && (
                <div className="flex items-center w-full justify-center">
                  <button
                    className="p-1 text-white/90 hover:bg-white/20 rounded-full flex-shrink-0"
                    onClick={() => {
                      if (onDaysChange) {
                        const newDays = days.map(day => {
                          const newDate = new Date(day);
                          newDate.setDate(newDate.getDate() - 1);
                          return newDate;
                        });
                        onDaysChange(newDays);

                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() - 1);
                        onDateChange(newDate);
                      }
                    }}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <div className="overflow-x-auto scrollbar-hide flex-grow mx-1">
                    <div className="flex w-max mx-auto">
                      {days.map(day => (
                        <button
                          key={day.toISOString()}
                          onClick={() => onDateChange(day)}
                          className={`mx-0.5 px-2 py-0.5 text-xs rounded-md whitespace-nowrap transition-all ${day.toDateString() === selectedDate.toDateString()
                            ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 font-medium shadow-sm'
                            : 'bg-white/10 text-white/90 hover:bg-white/20'
                            }`}
                        >
                          {day.toLocaleDateString('en-US', {
                            weekday: window.innerWidth < 375 ? 'narrow' : 'short',
                            day: 'numeric'
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="p-1 text-white/90 hover:bg-white/20 rounded-full flex-shrink-0"
                    onClick={() => {
                      if (onDaysChange) {
                        const newDays = days.map(day => {
                          const newDate = new Date(day);
                          newDate.setDate(newDate.getDate() + 1);
                          return newDate;
                        });
                        onDaysChange(newDays);

                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() + 1);
                        onDateChange(newDate);
                      }
                    }}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Project content - with consistent text size */}
              {activeTab === 'project' && onProjectSelect && (
                <div className="flex items-center w-full">
                  {projectNotes.length === 0 ? (
                    <span className="text-xs text-white/80 px-2 flex-grow text-center">No pages</span>
                  ) : (
                    <div className="overflow-x-auto scrollbar-hide flex-grow px-1 max-w-full">
                      <div className="flex w-max">
                        {projectNotes.map(project => (
                          <button
                            key={project.id}
                            onClick={() => onProjectSelect(project)}
                            className={`mx-0.5 px-2 py-0.5 text-xs rounded-md whitespace-nowrap transition-all ${selectedProject?.id === project.id
                              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 font-medium shadow-sm'
                              : 'bg-white/10 text-white/90 hover:bg-white/20'
                              }`}
                          >
                            {project.title || "Untitled"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="flex flex-col flex-grow overflow-auto"
        >
          <EditorContent
            className="w-full break-words radius-lg h-full"
            extensions={extensions}
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full radius-lg`,
              }
            }}
            initialContent={initialContent}
            onUpdate={({ editor }) => handleContentUpdate(editor)}
            immediatelyRender={false}
            slotAfter={<ImageResizer />}
            onContentError={(error) => {
              console.error("Content error", error);
            }}
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
              <Separator orientation="vertical" />
              <EventSelector open={openEvent} onOpenChange={setOpenEvent} /> {/* Add the new component here */}
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

        {/* Footer with justified content - Last saved on left, ProjectDialogs on right */}
        <div className="flex justify-between items-center z-10 p-2 border-t">
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="text-xs text-muted-foreground">
                Saving...
              </div>
            )}
            {!isSaving && lastSaved && (
              <div className="text-xs text-muted-foreground p-2 sm:p-4">
                Last saved: {formatRelativeTime(lastSaved)}
              </div>
            )}
          </div>
          {
            selectedProject &&
            handleRenameProject &&
            handleDeleteProject && (
              <div>
                <ProjectDialogs
                  project={selectedProject!}
                  onRenameProject={handleRenameProject}
                  onDeleteProject={handleDeleteProject}
                />
              </div>
            )}
        </div>
      </div>
    </EditorRoot>
  );
};