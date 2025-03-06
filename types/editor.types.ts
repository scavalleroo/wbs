import { JSONContent } from "novel";
import { ProjectNote, TypeNoteTab } from "@/lib/project";
import { DebouncedState } from "use-debounce";

export interface EditorProps {
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

export interface EditorViewProps {
  activeTab: TypeNoteTab;
  content: JSONContent | null | undefined;
  onContentChange: (content: JSONContent) => void;
  isOverflowing: boolean;
}