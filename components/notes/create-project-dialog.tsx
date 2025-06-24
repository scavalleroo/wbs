import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';

interface CreateProjectDialogProps {
    onCreateProject: (title: string) => Promise<void>;
    disabled?: boolean;
    variant?: 'default' | 'dropdown';
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
    onCreateProject,
    disabled = false,
    variant = 'default',
}) => {
    const [projectTitle, setProjectTitle] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Reset project title when dialog opens/closes
    useEffect(() => {
        if (isOpen === false) {
            setProjectTitle('');
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!projectTitle.trim()) return;

        setIsCreating(true);
        try {
            await onCreateProject(projectTitle.trim());
            setIsOpen(false);
            setProjectTitle('');
        } catch (error) {
            console.error('Project creation failed', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {variant === 'dropdown' ? (
                    <button
                        disabled={disabled}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>Add New Page</span>
                    </button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20 transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Page</span>
                    </Button>
                )}
            </DialogTrigger>

            {/* Enhanced Dialog Styling */}
            <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1 shadow-xl">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg p-0 overflow-y-auto max-h-[80vh]">
                        {/* Gradient Header */}
                        <DialogHeader className="p-0">
                            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 p-6 text-white">
                                <DialogTitle className="text-2xl font-bold mb-1">Create New Page</DialogTitle>
                                <DialogDescription className="text-white/80 text-sm">
                                    Add a new page to organize your project notes, ideas, or research.
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {/* Content Area */}
                        <div className="p-6">
                            <div className="space-y-2">
                                <Label htmlFor="projectTitle" className="text-sm font-medium">
                                    Page Title
                                </Label>
                                <Input
                                    id="projectTitle"
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && projectTitle.trim() && !isCreating) {
                                            handleCreate();
                                        }
                                    }}
                                    className="w-full border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 shadow-sm"
                                    placeholder="Enter a descriptive title for your page"
                                    autoFocus
                                />
                            </div>

                            {/* Footer with Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isCreating}
                                    className="border-neutral-200 dark:border-neutral-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleCreate}
                                    disabled={!projectTitle.trim() || isCreating}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Page'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProjectDialog;