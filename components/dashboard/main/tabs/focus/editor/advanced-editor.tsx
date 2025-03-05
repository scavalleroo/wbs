"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  EditorRoot,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorContent,
  type JSONContent,
  EditorCommandList,
  EditorBubble,
} from "novel";
import { handleCommandNavigation, ImageResizer } from "novel";
import { defaultExtensions } from "./extensions";
import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { ColorSelector } from "./selectors/color-selector";
import { format } from "date-fns";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import { handleImageDrop, handleImagePaste } from "novel";
import { uploadFn } from "./image-upload";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import DateRadioGroup from "./date-radio-group";
import NotesController from "./notes-controller";
import { zodResolver } from "@hookform/resolvers/zod";
import { DebouncedState } from "use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectNote, TypeNoteTab } from "@/lib/project";
import ProjectSelector from "../project-selector";
import CreateProjectDialog from "../create-project-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const extensions = [...defaultExtensions, slashCommand];

interface EditorProp {
  projects: ProjectNote[];
  projectsLoading: boolean;
  selectedProject: ProjectNote | null;
  createProject: (title: string) => Promise<void>;
  selectProject: (project: ProjectNote) => void;
  saveProjectNote: (project: ProjectNote, content: JSONContent) => void;
  initialValue: JSONContent | null | undefined;
  initialSelectedDate: Date;
  onChange: DebouncedState<(value: JSONContent) => Promise<void>>;
  onChangeDate: (date: Date, value: JSONContent) => void;
}

const FormSchema = z.object({
  startDate: z.date({
    required_error: "The date of the note is required",
  }),
})

const Editor = ({
  projects,
  projectsLoading,
  selectedProject,
  createProject,
  selectProject,
  saveProjectNote,
  initialValue,
  initialSelectedDate,
  onChange,
  onChangeDate
}: EditorProp) => {
  const [activeNoteTab, setActiveNoteTab] = useState<TypeNoteTab>("daily");
  const [currentContent, setCurrentContent] = useState<JSONContent | null | undefined>(initialValue);
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const [days, setDays] = useState<Date[]>(
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 1 + i);
      return date;
    })
  );

  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  // Check overflow on resize
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

  // Determine current content based on active tab
  const getCurrentContent = useMemo(() => {
    if (activeNoteTab === 'daily') {
      return {
        content: currentContent,
        onSave: (content: JSONContent) => {
          onChange(content);
          onChangeDate(selectedDate, content);
        }
      };
    }

    if (activeNoteTab === 'project' && selectedProject) {
      return {
        content: selectedProject.content as JSONContent || null,
        onSave: (content: JSONContent) => {
          saveProjectNote(selectedProject, content);
        }
      };
    }

    return { content: null, onSave: () => { } };
  }, [activeNoteTab, currentContent, selectedProject, onChange, onChangeDate, saveProjectNote, selectedDate]);

  // Handle date change in daily notes
  function onDateChange(data: z.infer<typeof FormSchema>) {
    const startDate = new Date(data.startDate);
    const newDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      newDays.push(date);
    }

    setDays(newDays);
    onChangeDate(startDate, currentContent ?? {});
  }

  // Render loading state if needed
  if (initialValue === null || (activeNoteTab === 'project' && projectsLoading)) {
    return (
      <div className="flex flex-col gap-2 w-full h-full p-2 bg-card text-card-foreground border shadow rounded-xl flex-grow">
        <div className="flex flex-row items-center justify-between">
          <p className="font-bold pl-2">{activeNoteTab === 'daily' ? 'Daily notes' : 'Project notes'}</p>
          <Skeleton className="w-12 md:w-32 h-8" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-8 h-8" />
        </div>
        <div className="w-full h-full p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  const dailyEditorView = <TabsContent value="daily" className="relative flex flex-col overflow-auto w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <Button
        className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
        variant="outline"
        onClick={() => {
          // logCustomEvent("advance_editor_previous_day");
          const newDays = days.map((day) => {
            const newDate = new Date(day);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
          });
          setDays(newDays);
          setSelectedDate(newDays[0]);
          onChangeDate(newDays[0], currentContent ?? {});
        }}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <DateRadioGroup
        selectedDate={selectedDate}
        days={days}
        isOverflowing={isOverflowing}
        isPending={onChange.isPending()}
        onChangeDate={(date) => onChangeDate(date, currentContent ?? {})} />
      <Button
        className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
        variant="outline"
        onClick={() => {
          // logCustomEvent("advance_editor_next_day");
          const newDays = days.map((day) => {
            const newDate = new Date(day);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
          });
          setDays(newDays);
          setSelectedDate(newDays[newDays.length - 1]);
          onChangeDate(newDays[newDays.length - 1], currentContent ?? {});
        }}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>

    <EditorRoot>
      <EditorContent
        className="border p-4 rounded-sm overflow-auto flex-grow bg-background break-all"
        extensions={extensions}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },

          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
          attributes: {
            id: "advanceEditor",
            class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
          },
        }}
        initialContent={initialValue == undefined ? {} : initialValue}
        onUpdate={({ editor }) => {
          setCurrentContent(editor.getJSON());
        }}
        immediatelyRender={false}
        slotAfter={<ImageResizer />}
        onContentError={(error) => {
          console.error("Content error", error);
        }}
      >
        <NotesController initialValue={initialValue} setCurrentContent={setCurrentContent} />
        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item: any) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent `}
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        <EditorBubble
          tippyOptions={{
            placement: "top",
          }}
          className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
        >
          <Separator orientation="vertical" />
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <Separator orientation="vertical" />

          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
          <Separator orientation="vertical" />
          <TextButtons />
          <Separator orientation="vertical" />
          <ColorSelector open={openColor} onOpenChange={setOpenColor} />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  </TabsContent>;

  const projectEditorView = <TabsContent value="project" className="relative flex flex-col overflow-auto w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <RadioGroup
        value={selectedProject?.id.toString() || ''}
        className="flex flex-row gap-1 overflow-x-hidden w-full px-1"
        onValueChange={(value) => {
          const project = projects.find(p => p.id.toString() === value);
          if (project) selectProject(project);
        }}
      >
        {projects.length === 0 ? (
          <div className="w-56 flex-shrink-0">
            <Label
              className="flex min-h-10 
          flex-col relative 
          items-center 
          rounded-md border-2 border-muted bg-popover 
          py-1 md:px-1 md:py-0.5
          cursor-pointer
          text-sm 
          transition-colors duration-200
          bg-primary 
          text-primary-foreground
          border-primary
          whitespace-nowrap
          text-nowrap w-full h-full justify-center
          "
              onDoubleClick={(e) => {
                const newTitle = prompt("Enter new project name:", "Untitled project");
                if (newTitle && newTitle.trim()) {
                  createProject(newTitle.trim());
                }
              }}
            >
              <p className="text-xs truncate max-w-full">Untitled project</p>
            </Label>
          </div>
        ) : (
          projects.map((project) => (
            <div className="flex-grow" key={project.id}>
              <RadioGroupItem
                value={project.id.toString()}
                id={project.id.toString()}
                className="peer sr-only"
              />
              <Label
                htmlFor={project.id.toString()}
                className="flex min-h-10 
              flex-col relative 
              items-center 
              rounded-md border-2 border-muted bg-popover 
              py-1 md:px-1 md:py-0.5 hover:bg-accent hover:text-accent-foreground 
              cursor-pointer
              text-sm 
              border border-transparent
              transition-colors duration-200
              bg-secondary 
              hover:bg-accent 
              peer-data-[state=checked]:bg-primary 
              peer-data-[state=checked]:text-primary-foreground
              peer-data-[state=checked]:border-primary
              whitespace-nowrap
              text-nowrap w-full h-full justify-center
              "
              >
                <p className="text-xs truncate max-w-full">{project.title}</p>
              </Label>
            </div>
          ))
        )}
      </RadioGroup>
    </div>
    <EditorRoot>
      <EditorContent
        className="border p-4 rounded-sm overflow-auto flex-grow bg-background break-all"
        extensions={extensions}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },

          handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
          handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
          attributes: {
            id: "advanceEditor",
            class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
          },
        }}
        initialContent={{}}
        onUpdate={({ editor }) => {
          const newContent = editor.getJSON();
          setCurrentContent(newContent);

          // Auto-save project note when content changes
          if (selectedProject && activeNoteTab === 'project') {
            saveProjectNote(selectedProject, newContent);
          }
        }}
        immediatelyRender={false}
        slotAfter={<ImageResizer />}
        onContentError={(error) => {
          console.error("Content error", error);
        }}
      >
        <NotesController initialValue={currentContent} setCurrentContent={setCurrentContent} />
        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item: any) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent `}
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        <EditorBubble
          tippyOptions={{
            placement: "top",
          }}
          className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
        >
          <Separator orientation="vertical" />
          <NodeSelector open={openNode} onOpenChange={setOpenNode} />
          <Separator orientation="vertical" />

          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
          <Separator orientation="vertical" />
          <TextButtons />
          <Separator orientation="vertical" />
          <ColorSelector open={openColor} onOpenChange={setOpenColor} />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  </TabsContent>;



  return (
    <Tabs
      defaultValue="daily"
      value={activeNoteTab}
      onValueChange={(value) => {
        const newTabValue = value as TypeNoteTab;
        setActiveNoteTab(newTabValue);

        // Update content based on selected tab
        if (newTabValue === 'daily') {
          // Use the current daily note content
          setCurrentContent(currentContent);
        } else if (newTabValue === 'project') {
          // Use the selected project's content
          if (selectedProject) {
            // Set currentContent to the selected project's content, defaulting to empty object if null
            console.log("Selected");
            setCurrentContent((selectedProject.content as JSONContent) || {});
          } else if (!projectsLoading && projects.length === 0) {
            // Create first project if none exists and projects aren't currently loading
            createProject("Untitled project").catch(error => {
              console.error("Failed to create default project:", error);
            });
            console.log("No content");
            setCurrentContent({})
          } else if (projects.length > 0) {
            // Select the first project if none is selected but projects exist
            selectProject(projects[0]);
            console.log("Setting: ", projects[0].content as JSONContent);
            setCurrentContent(projects[0].content as JSONContent);
          }
        }
      }}
      className="w-full h-full"
    >
      <div className="flex flex-col gap-2 w-full h-full p-2 bg-card text-card-foreground border shadow rounded-xl flex-grow">
        <div className="flex flex-row items-center justify-between">
          <TabsList>
            <TabsTrigger value='daily'>Daily</TabsTrigger>
            <TabsTrigger value='project'>Project</TabsTrigger>
          </TabsList>
          {activeNoteTab === "daily" && (
            <Form {...form}>
              <form ref={formRef} className="space-y-8">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "md:w-[240px] md:pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span className="hidden md:block">Which week?</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              if (date) {
                                setSelectedDate(date);
                                onDateChange(form.getValues());
                              }
                            }}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {activeNoteTab === "project" && (
            <CreateProjectDialog
              onCreateProject={async (title) => {
                await createProject(title);
              }}
            />
          )}
        </div>

        {activeNoteTab === "daily" && dailyEditorView}
        {activeNoteTab === "project" && projectEditorView}

      </div>
    </Tabs>
  );
};

export default Editor;