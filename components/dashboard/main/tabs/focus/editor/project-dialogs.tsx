import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { ProjectNote } from '@/lib/project';

interface ProjectDialogsProps {
    project: ProjectNote;
    onRenameProject: (id: number, newTitle: string) => Promise<void>;
    onDeleteProject: (id: number) => Promise<void>;
}

const ProjectDialogs: React.FC<ProjectDialogsProps> = ({
    project,
    onRenameProject,
    onDeleteProject
}) => {
    // Rename dialog state
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState(project.title);
    const [isRenaming, setIsRenaming] = useState(false);

    // Delete dialog state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle rename
    const handleRename = async () => {
        if (!newProjectTitle.trim() || newProjectTitle === project.title) return;

        setIsRenaming(true);
        try {
            await onRenameProject(project.id, newProjectTitle.trim());
            setIsRenameOpen(false);
        } catch (error) {
            console.error('Project rename failed', error);
        } finally {
            setIsRenaming(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDeleteProject(project.id);
            setIsDeleteOpen(false);
        } catch (error) {
            console.error('Project deletion failed', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex-shrink-0">
            {/* Project Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => {
                        setNewProjectTitle(project.title);
                        setIsRenameOpen(true);
                    }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename page
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setIsDeleteOpen(true)}
                        className="text-destructive"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete page
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Rename Project Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Page</DialogTitle>
                        <DialogDescription>
                            Enter a new title for your page
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newProjectTitle" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="newProjectTitle"
                                value={newProjectTitle}
                                onChange={(e) => setNewProjectTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !(!newProjectTitle.trim() || newProjectTitle === project.title || isRenaming)) {
                                        e.preventDefault();
                                        handleRename();
                                    }
                                }}
                                className="col-span-3"
                                placeholder="Enter new project name"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRenameOpen(false)}
                            disabled={isRenaming}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleRename}
                            disabled={!newProjectTitle.trim() || newProjectTitle === project.title || isRenaming}
                        >
                            {isRenaming ? 'Renaming...' : 'Rename Page'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Project Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Page</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{project.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Page'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectDialogs;