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
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Rename Button */}
                <button
                    onClick={() => {
                        setNewProjectTitle(project.title);
                        setIsRenameOpen(true);
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all"
                    title="Rename page"
                >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Rename</span>
                </button>

                {/* Delete Button */}
                <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all"
                    title="Delete page"
                >
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Delete</span>
                </button>
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

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                        <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {/* Gradient Header */}
                            <DialogHeader className="p-0">
                                <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold mb-1 flex items-center gap-2">
                                        <Trash className="h-5 w-5 text-white/90" />
                                        Delete Page
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 m-0">
                                        This action cannot be undone.
                                    </DialogDescription>
                                </div>
                            </DialogHeader>

                            {/* Content Area */}
                            <div className="p-6">
                                <p className="mb-2">
                                    Are you sure you want to delete "<span className="font-medium">{project.title}</span>"?
                                    All content will be permanently removed.
                                </p>

                                {/* Project preview card - similar to session preview */}
                                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500/30 backdrop-blur-sm text-xl shadow-inner">
                                            📄
                                        </div>
                                        <div>
                                            <p className="text-base font-medium">{project.title}</p>
                                            <p className="text-sm text-neutral-500">
                                                Page will be permanently deleted
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 sm:p-6 border-t dark:border-neutral-800 flex sm:justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDeleteOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 border-0"
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>Delete Page</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectDialogs;