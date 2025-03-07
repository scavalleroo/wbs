import React, { useState } from 'react';
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
import { Plus } from 'lucide-react';

interface CreateProjectDialogProps {
    onCreateProject: (title: string) => Promise<void>;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
    onCreateProject,
}) => {
    const [projectTitle, setProjectTitle] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

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
                    className="flex-1 min-h-10 flex flex-col items-center 
                                    rounded-md border-2 border-muted bg-popover 
                                    py-1 md:px-1 md:py-0.5 hover:bg-accent hover:text-accent-foreground 
                                    cursor-pointer text-sm transition-colors duration-200
                                    bg-secondary border-transparent
                                    whitespace-nowrap justify-center"
                    onClick={() => { }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Page</DialogTitle>
                    <DialogDescription>
                        Enter a title for your new page
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="projectTitle" className="text-right">
                            Title
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
                            placeholder="Enter page name"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleCreate}
                        disabled={!projectTitle.trim() || isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Page'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProjectDialog;