import { JSONContent } from "novel";
import { ProjectNote } from "@/lib/project";

export const getInitialContent = (
  activeTab: 'daily' | 'project', 
  currentContent: JSONContent | null | undefined, 
  selectedProject: ProjectNote | null,
  projects: ProjectNote[]
): JSONContent => {
  if (activeTab === 'daily') {
    return currentContent ?? {};
  }

  if (selectedProject) {
    return (selectedProject.content as JSONContent) || {};
  }

  if (projects.length > 0) {
    return (projects[0].content as JSONContent) || {};
  }

  return {};
};

export const getWeekDays = (startDate: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });
};