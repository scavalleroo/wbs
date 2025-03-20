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
import { Pencil, Trash, Loader2 } from 'lucide-react';
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
        <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
                {/* Rename Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setNewProjectTitle(project.title);
                        setIsRenameOpen(true);
                    }}
                    className="h-8 px-2 sm:px-3 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">Rename</span>
                </Button>

                {/* Delete Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                    className="h-8 px-2 sm:px-3 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors border-0"
                >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
                </Button>
            </div>

            {/* Rename Project Dialog - Updated Styling */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh]">
                            {/* Gradient Header */}
                            <DialogHeader className="p-0">
                                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold mb-1">Rename Page</DialogTitle>
                                    <DialogDescription className="text-white/80 text-sm">
                                        Enter a new title for your page.
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newProjectTitle" className="text-sm font-medium">
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
                                            className="w-full border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 shadow-sm"
                                            placeholder="Enter new page title"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Footer with Actions */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRenameOpen(false)}
                                        disabled={isRenaming}
                                        className="border-neutral-200 dark:border-neutral-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        onClick={handleRename}
                                        disabled={!newProjectTitle.trim() || newProjectTitle === project.title || isRenaming}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                                    >
                                        {isRenaming ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Renaming...
                                            </>
                                        ) : (
                                            'Rename Page'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Project Dialog - Updated Styling */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-600 dark:to-neutral-800 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh]">
                            {/* Softer Header with just a touch of rose */}
                            <DialogHeader className="p-0">
                                <div className="bg-gradient-to-r from-neutral-700 via-neutral-700 to-neutral-700 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-800 border-b-2 border-rose-500 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold mb-1 flex items-center">
                                        <Trash className="h-5 w-5 text-rose-400 mr-2" /> Delete Page
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-sm">
                                        This action cannot be undone.
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            <div className="p-6">
                                <p className="mb-6">
                                    Are you sure you want to delete "<span className="font-medium">{project.title}</span>"?
                                    All content will be permanently removed.
                                </p>

                                {/* Footer with Actions */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDeleteOpen(false)}
                                        disabled={isDeleting}
                                        className="border-neutral-200 dark:border-neutral-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-rose-500 border"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash className="mr-2 h-4 w-4 text-rose-400" />
                                                Delete Page
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectDialogs;