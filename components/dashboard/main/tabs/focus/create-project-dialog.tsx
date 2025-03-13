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
import { Plus, PlusCircle } from 'lucide-react';

interface CreateProjectDialogProps {
    onCreateProject: (title: string) => Promise<void>;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
    onCreateProject,
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
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md px-3 py-1 text-sm transition-colors
                              bg-neutral-900/30 dark:bg-neutral-50/30 text-white
                              hover:bg-white hover:bg-opacity-20 flex-shrink-0"
                >
                    <PlusCircle className="sm:mr-1" />
                    <span className="whitespace-nowrap sm:block hidden">New Page</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="border-indigo-100">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl font-bold">Create New Page</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Add a new page to organize your project notes, ideas, or research.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 items-center gap-4">
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
                            className="col-span-3"
                            placeholder="Enter a descriptive title for your page"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isCreating}
                        className="border-indigo-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleCreate}
                        disabled={!projectTitle.trim() || isCreating}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    >
                        {isCreating ? (
                            <>
                                <span className="mr-2">Creating...</span>
                                <span className="animate-spin">⏳</span>
                            </>
                        ) : (
                            'Create Page'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProjectDialog;