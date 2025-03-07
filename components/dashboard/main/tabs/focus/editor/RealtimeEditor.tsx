"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandList,
  EditorCommandItem,
  EditorBubble,
  JSONContent,
  type EditorInstance,
} from "novel";
import {
  handleCommandNavigation,
  handleImagePaste,
  handleImageDrop,
  ImageResizer
} from "novel";
import { Separator } from "@/components/ui/separator";
import { NodeSelector } from "./selectors/node-selector";
import { LinkSelector } from "./selectors/link-selector";
import { ColorSelector } from "./selectors/color-selector";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import { uploadFn } from "./image-upload";
import NotesController from "./notes-controller";
import { defaultExtensions } from './extensions';
import { createClient } from '@/utils/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

// Extend the existing extensions with slash command
const extensions = [...defaultExtensions, slashCommand];

interface RealtimeEditorProps {
  tableName: 'user_daily_notes' | 'user_projects_notes';
  rowId: string | number;
  initialContent?: JSONContent;
  initalLastSaved?: Date;
  onContentUpdate?: (content: JSONContent) => void;
}

export const RealtimeEditor: React.FC<RealtimeEditorProps> = ({
  tableName,
  rowId,
  initialContent = {},
  initalLastSaved,
  onContentUpdate
}) => {
  const supabase = createClient();
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [localContent, setLocalContent] = useState<JSONContent>(initialContent);
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
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
    <EditorRoot key={`editor-${rowId}`}>
      <div className="relative w-full h-full overflow-y-auto">
        {isSaving && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Saving...
          </div>
        )}
        {!isSaving && lastSaved && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
        <EditorContent
          className="border p-4 rounded-sm overflow-auto flex-grow bg-background break-all h-full"
          extensions={extensions}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              id: "debouncedEditor",
              class: `prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full`,
            },
          }}
          initialContent={initialContent}
          onUpdate={({ editor }) => handleContentUpdate(editor)}
          immediatelyRender={false}
          slotAfter={<ImageResizer />}
          onContentError={(error) => {
            console.error("Content error", error);
          }}
        >
          <NotesController
            initialValue={initialContent}
            setCurrentContent={setLocalContent}
          />

          {/* Command Palette */}
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item: any) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent`}
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

          {/* Editor Bubble */}
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
      </div>
    </EditorRoot>
  );
};