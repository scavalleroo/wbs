"use client";

import { Command, CommandInput } from "@/components/ui/command";

import { useCompletion } from "ai/react";
import { ArrowUp } from "lucide-react";
import { useEditor } from "novel";
import { addAIHighlight } from "novel";
import { useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CrazySpinner from "@/components/ui/icons/crazy-spinner";
import Magic from "@/components/ui/icons/magic";
import { ScrollArea } from "@/components/ui/scroll-area";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { editor } = useEditor();
  const [inputValue, setInputValue] = useState("");

  const { completion, complete, isLoading } = useCompletion({
    // id: "novel",
    api: "/api/generate",
    onResponse: (response) => {
      if (response.status === 429) {
        toast.error("You have reached your request limit for the day.");
        return;
      }
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  const hasCompletion = completion.length > 0;

  return (
    <div className="absolute z-[50] flex items-center justify-center">
      <Command className="w-[350px]">
        {hasCompletion && (
          <div className="flex max-h-[400px]">
            <ScrollArea className="w-full">
              <div className="prose dark:prose-invert prose-sm p-2 px-4
                     prose-headings:text-foreground
                     prose-p:text-foreground
                     prose-strong:text-foreground
                     prose-a:text-primary hover:prose-a:text-primary/80
                     prose-code:text-muted-foreground dark:prose-code:bg-muted/50
                     prose-pre:bg-muted dark:prose-pre:bg-muted/50
                     prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary
                     dark:prose-pre:text-muted-foreground">
                <Markdown>{completion}</Markdown>
              </div>
            </ScrollArea>
          </div>
        )}

        {isLoading && (
          <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
            <Magic className="mr-2 h-4 w-4 shrink-0  " />
            AI is thinking
            <div className="ml-2 mt-1">
              <CrazySpinner />
            </div>
          </div>
        )}
        {!isLoading && (
          <>
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize the textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                autoFocus
                className="flex w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 pr-10 resize-none border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{
                  wordWrap: 'break-word',
                  paddingRight: '2.5rem',
                  overflow: 'hidden',  // Hide scrollbars
                  minHeight: '40px',
                  maxHeight: '200px'
                }}
                placeholder={hasCompletion ? "Tell AI what to do next" : "Ask AI to edit or generate..."}
                onFocus={(e) => {
                  addAIHighlight(editor!);
                  // Set initial height when focused
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                // Support Enter key for submission (shift+enter for new line)
                onKeyDown={(e) => {
                  // Auto-resize on key events too
                  setTimeout(() => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }, 0);

                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();

                    if (completion) {
                      complete(completion, {
                        body: { option: "zap", command: inputValue },
                      }).then(() => setInputValue(""));
                      return;
                    }

                    const slice = editor!.state.selection.content();
                    const text = editor!.storage.markdown.serializer.serialize(slice.content);

                    complete(text, {
                      body: { option: "zap", command: inputValue },
                    }).then(() => setInputValue(""));
                  }
                }}
              />
              <Button
                size="icon"
                className="absolute right-2 top-[calc(1.5rem-3px)] h-6 w-6 rounded-full bg-purple-500 hover:bg-purple-900"
                onClick={() => {
                  if (completion)
                    return complete(completion, {
                      body: { option: "zap", command: inputValue },
                    }).then(() => setInputValue(""));

                  const slice = editor!.state.selection.content();
                  const text = editor!.storage.markdown.serializer.serialize(slice.content);

                  complete(text, {
                    body: { option: "zap", command: inputValue },
                  }).then(() => setInputValue(""));
                }}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            {hasCompletion ? (
              <AICompletionCommands
                onDiscard={() => {
                  editor!.chain().unsetHighlight().focus().run();
                  onOpenChange(false);
                }}
                completion={completion}
              />
            ) : (
              <AISelectorCommands onSelect={(value, option) => complete(value, { body: { option } })} />
            )}
          </>
        )}
      </Command>
    </div>
  );
}
