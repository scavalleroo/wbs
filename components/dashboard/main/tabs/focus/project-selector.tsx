// src/components/project-selector.tsx
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { ProjectNote } from '@/lib/project';

interface ProjectSelectorProps {
    projects: ProjectNote[];
    selectedProject: ProjectNote | null;
    onSelectProject: (project: ProjectNote) => void;
    onCreateProject: () => void;
    isOverflowing?: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
    projects,
    selectedProject,
    onSelectProject,
    onCreateProject,
    isOverflowing = false
}) => {
    // Determine which projects to show based on overflow
    const displayProjects = isOverflowing
        ? projects.slice(0, 4)
        : projects;

    return (
        <div className="flex items-center gap-2 w-full">
            <button
                onClick={onCreateProject}
                className="bg-muted text-muted-foreground p-2 rounded-md hover:bg-accent"
                aria-label="Add project"
            >
                <Plus className="h-5 w-5" />
            </button>
        </div>
    );
};

export default ProjectSelector;