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
                <Button variant="default">Add project</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Enter a title for your new project
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
                            className="col-span-3"
                            placeholder="Enter project name"
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
                        {isCreating ? 'Creating...' : 'Create Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProjectDialog;