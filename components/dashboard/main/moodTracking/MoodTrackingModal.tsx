import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MoodScale from './MoodScale';
import { WellnessRatings } from '@/types/mood.types';
import useMood from '@/hooks/use-mood';
import { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';

interface MoodTrackingModalProps {
    user: User | null | undefined;
}

const steps = [
    {
        id: 'mood',
        question: 'How are you feeling today?',
        field: 'mood_rating' as keyof WellnessRatings
    },
    {
        id: 'sleep',
        question: 'How well did you sleep?',
        field: 'sleep_rating' as keyof WellnessRatings
    },
    {
        id: 'nutrition',
        question: 'How healthy are your meals today?',
        field: 'nutrition_rating' as keyof WellnessRatings
    },
    {
        id: 'exercise',
        question: 'How active have you been today?',
        field: 'exercise_rating' as keyof WellnessRatings
    },
    {
        id: 'social',
        question: 'How\'s your social connection today?',
        field: 'social_rating' as keyof WellnessRatings
    }
];

interface MoodTrackingModalProps {
    user: User | null | undefined;
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
    selectedDate?: string; // Optional date for historical tracking
    onComplete?: () => void;
}

// In the component body, add support for selectedDate
const MoodTrackingModal = ({
    user,
    isOpen: externalIsOpen,
    setIsOpen: externalSetIsOpen,
    selectedDate,
    onComplete
}: MoodTrackingModalProps) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen = externalSetIsOpen || setInternalIsOpen;
    const { submitWellness, skipWellness, hasWellnessForToday } = useMood({ user });
    const [currentStep, setCurrentStep] = useState(0);
    const [ratings, setRatings] = useState<WellnessRatings>({
        mood_rating: null,
        sleep_rating: null,
        nutrition_rating: null,
        exercise_rating: null,
        social_rating: null
    });
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const trackingDate = selectedDate ? new Date(selectedDate) : new Date();

    useEffect(() => {
        if (!user) return;

        const checkWellness = async () => {
            const wellnessExists = await hasWellnessForToday();
            if (!wellnessExists) {
                setIsOpen(true);
            }
        };

        checkWellness();
    }, [user, hasWellnessForToday]);

    const handleRatingSelect = (rating: number) => {
        // Update the current rating
        const currentField = steps[currentStep].field;
        setRatings(prev => ({ ...prev, [currentField]: rating }));

        // Move to the next step or notes section
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowNotes(true);
        }
    };

    const handleSkipStep = () => {
        // Skip this question by setting null and moving to next step
        const currentField = steps[currentStep].field;
        setRatings(prev => ({ ...prev, [currentField]: null }));

        // Move to the next step or notes section
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowNotes(true);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        setIsSubmitting(true);
        try {
            await submitWellness(ratings, description, trackingDate);
            setIsOpen(false);
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error submitting wellness data:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipAll = async () => {
        if (!user) return;

        setIsSubmitting(true);
        try {
            await skipWellness();
            setIsOpen(false);
        } catch (error) {
            console.error('Error skipping wellness tracking:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if user isn't logged in
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md w-[92vw] max-w-full p-4 sm:p-6 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-xl">
                <DialogHeader className="mb-2 sm:mb-4">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-center">Daily Wellness Check</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {!showNotes ? (
                            <motion.div
                                key={`step-${currentStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <MoodScale
                                    question={steps[currentStep].question}
                                    onSelect={handleRatingSelect}
                                    onSkip={handleSkipStep}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="notes"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid gap-3 py-4"
                            >
                                <Label htmlFor="mood-description" className="text-sm font-medium">
                                    Any additional notes? (optional)
                                </Label>
                                <Textarea
                                    id="mood-description"
                                    placeholder="Share anything else about your day..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="resize-vertical bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 rounded-lg"
                                />
                                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowNotes(false)}
                                        className="w-full sm:w-auto bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!showNotes && (
                    <DialogFooter className="flex justify-between pt-2">
                        <div className="flex space-x-1 items-center">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full ${idx === currentStep
                                        ? 'w-5 bg-blue-500'
                                        : idx < currentStep
                                            ? 'w-3 bg-blue-300'
                                            : 'w-3 bg-neutral-300 dark:bg-neutral-600'
                                        }`}
                                />
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleSkipAll}
                            disabled={isSubmitting}
                            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                        >
                            Skip all
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MoodTrackingModal;