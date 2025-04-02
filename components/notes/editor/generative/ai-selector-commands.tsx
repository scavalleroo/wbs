import { ArrowDownWideNarrow, CheckCheck, RefreshCcwDot, StepForward, WrapText } from "lucide-react";
import { getPrevText, useEditor } from "novel";
import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";

const options = [
  {
    value: "improve",
    label: "Improve writing",
    icon: RefreshCcwDot,
  },
  {
    value: "fix",
    label: "Fix grammar",
    icon: CheckCheck,
  },
  {
    value: "shorter",
    label: "Make shorter",
    icon: ArrowDownWideNarrow,
  },
  {
    value: "longer",
    label: "Make longer",
    icon: WrapText,
  },
];

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  const { editor } = useEditor();

  return (
    <>
      <CommandGroup heading="Edit or review selection" className="text-zinc-700 dark:text-zinc-300">
        {options.map((option) => (
          <CommandItem
            onSelect={(value) => {
              const slice = editor!.state.selection.content();
              const text = editor!.storage.markdown.serializer.serialize(slice.content);
              onSelect(text, value);
            }}
            className="flex gap-2 px-4 text-zinc-800 dark:text-zinc-200 hover:bg-purple-200 dark:hover:bg-purple-900 group"
            key={option.value}
            value={option.value}
          >
            <option.icon className="h-4 w-4 text-purple-700 dark:text-purple-400 group-hover:text-purple-900 dark:group-hover:text-white" />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator className="bg-zinc-200 dark:bg-zinc-700" />
      <CommandGroup heading="Use AI to do more" className="text-zinc-700 dark:text-zinc-300">
        <CommandItem
          onSelect={() => {
            const pos = editor!.state.selection.from;
            const text = getPrevText(editor!, pos);
            onSelect(text, "continue");
          }}
          value="continue"
          className="gap-2 px-4 text-zinc-800 dark:text-zinc-200 hover:bg-purple-200 dark:hover:bg-purple-900 group"
        >
          <StepForward className="h-4 w-4 text-purple-700 dark:text-purple-400 group-hover:text-purple-900 dark:group-hover:text-white" />
          Continue writing
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AISelectorCommands;