import { useState, useMemo } from 'react';
import { JSONContent } from 'novel';
import { ProjectNote, TypeNoteTab } from '@/lib/project';
import { getInitialContent, getWeekDays } from '@/lib/editorUtils';

export const useEditorState = (
    initialValue: JSONContent | null | undefined,
    initialSelectedDate: Date,
    selectedProject: ProjectNote | null,
    projects: ProjectNote[],
    onChange: (content: JSONContent) => Promise<void>,
    onChangeDate: (date: Date, content: JSONContent) => void
) => {
    const [activeNoteTab, setActiveNoteTab] = useState<TypeNoteTab>('daily');
    const [currentContent, setCurrentContent] = useState<JSONContent | null | undefined>(initialValue);
    const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
    const [days, setDays] = useState<Date[]>(getWeekDays(initialSelectedDate));

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
                    // Implement project note saving logic
                }
            };
        }

        return { content: null, onSave: () => { } };
    }, [activeNoteTab, currentContent, selectedProject, onChange, onChangeDate]);

    const handleTabChange = (newTab: TypeNoteTab) => {
        setActiveNoteTab(newTab);
        setCurrentContent(
            getInitialContent(newTab, currentContent, selectedProject, projects)
        );
    };

    const handleDateChange = (date: Date) => {
        const newDays = getWeekDays(date);
        setDays(newDays);
        setSelectedDate(date);
        onChangeDate(date, currentContent ?? {});
    };

    return {
        activeNoteTab,
        currentContent,
        selectedDate,
        days,
        setCurrentContent,
        handleTabChange,
        handleDateChange,
        getCurrentContent
    };
};