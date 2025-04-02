import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { useEditor } from "novel";
import { Check, TextQuote, TrashIcon } from "lucide-react";

const AICompletionCommands = ({
  completion,
  onDiscard,
}: {
  completion: string;
  onDiscard: () => void;
}) => {
  const { editor } = useEditor();
  return (
    <>
      <CommandGroup>
        <CommandItem
          className="gap-2 px-4 text-zinc-800 dark:text-zinc-200 hover:bg-purple-200 dark:hover:bg-purple-900 group"
          value="replace"
          onSelect={() => {
            const selection = editor!.view.state.selection;

            editor!
              .chain()
              .focus()
              .insertContentAt(
                {
                  from: selection.from,
                  to: selection.to,
                },
                completion,
              )
              .run();
          }}
        >
          <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-white" />
          Replace selection
        </CommandItem>
        <CommandItem
          className="gap-2 px-4 text-zinc-800 dark:text-zinc-200 hover:bg-purple-200 dark:hover:bg-purple-900 group"
          value="insert"
          onSelect={() => {
            const selection = editor!.view.state.selection;
            editor!
              .chain()
              .focus()
              .insertContentAt(selection.to + 1, completion)
              .run();
          }}
        >
          <TextQuote className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-white" />
          Insert below
        </CommandItem>
      </CommandGroup>
      <CommandSeparator className="bg-zinc-200 dark:bg-zinc-700" />

      <CommandGroup>
        <CommandItem
          onSelect={onDiscard}
          value="thrash"
          className="gap-2 px-4 text-zinc-800 dark:text-zinc-200 hover:bg-purple-200 dark:hover:bg-purple-900 group"
        >
          <TrashIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-white" />
          Discard
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;