import React, { useEffect, useState } from 'react';
import MoodScale from './MoodScale';
import useMood from '@/hooks/use-mood';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from '@supabase/supabase-js';

interface MoodTrackingModalProps {
    user: User | null | undefined;
}

const MoodTrackingModal = ({ user }: MoodTrackingModalProps) => {
    const { submitMood, skipMood, hasMoodForToday } = useMood({ user });
    const [isOpen, setIsOpen] = useState(false);
    const [moodRating, setMoodRating] = useState(0);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Don't check for mood if user isn't logged in
        if (!user) return;

        const checkMood = async () => {
            const moodExists = await hasMoodForToday();
            if (!moodExists) {
                setIsOpen(true);
            }
        };

        // Check if user has already submitted mood today
        checkMood();
    }, [user, hasMoodForToday]); // Add proper dependencies

    const handleMoodSubmit = async () => {
        if (!user) return; // Ensure user is logged in

        if (moodRating === 0) {
            alert('Please select a mood before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            await submitMood(moodRating, description);
            setIsOpen(false);
        } catch (error) {
            console.error('Error submitting mood:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        if (!user) return; // Ensure user is logged in

        setIsSubmitting(true);
        try {
            await skipMood();
            setIsOpen(false);
        } catch (error) {
            console.error('Error skipping mood:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render the dialog if user isn't logged in
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">Mood Check In</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <MoodScale setMoodRating={setMoodRating} />

                    <div className="grid gap-2">
                        <Label htmlFor="mood-description" className="text-sm font-medium">
                            How's your day going? (optional)
                        </Label>
                        <Textarea
                            id="mood-description"
                            placeholder="Share a bit about how you're feeling today..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="resize-vertical"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="sm:w-[120px]"
                    >
                        {isSubmitting ? 'Processing...' : 'Skip for today'}
                    </Button>
                    <Button
                        onClick={handleMoodSubmit}
                        disabled={isSubmitting || moodRating === 0}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white sm:w-[120px]"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MoodTrackingModal;