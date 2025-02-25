import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from 'lucide-react';
import { LoadingGoalText } from './LoadingGoalsText';
import { GoalStep } from '@/types/plan';

interface GoalCardProps {
    goal: string;
    manualGoal: string;
    isManualEditing: boolean;
    setIsManualEditing: (value: boolean) => void;
    setManualGoal: (value: string) => void;
    currentStepIndex: number;
    goalSteps: GoalStep[];
    apiResponse: { isComplete: boolean } | null;
    loading: boolean;
    navigateStep: (direction: 'prev' | 'next') => void;
    handleManualEditSubmit: () => void;
}

export const GoalCard = ({
    goal,
    manualGoal,
    isManualEditing,
    setIsManualEditing,
    setManualGoal,
    currentStepIndex,
    goalSteps,
    apiResponse,
    loading,
    navigateStep,
    handleManualEditSubmit
}: GoalCardProps) => {
    return (
        <div className="space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    className="sm:size-lg p-1 sm:p-2 dark:text-gray-300"
                    onClick={() => navigateStep('prev')}
                    disabled={currentStepIndex === 0}
                >
                    <ChevronLeftIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>

                <div className="flex-1 mx-2 sm:mx-6">
                    {isManualEditing ? (
                        <Textarea
                            value={manualGoal}
                            onChange={(e) => setManualGoal(e.target.value)}
                            className="w-full min-h-[80px] sm:min-h-[120px] resize-none text-base sm:text-lg dark:bg-gray-700 dark:text-gray-200"
                            placeholder="Edit your goal..."
                        />
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {apiResponse && apiResponse.isComplete && (
                                <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-8">
                                    <Badge className="text-white text-sm sm:text-base bg-green-600 font-medium px-2 sm:px-4">
                                        Ready to generate the plan!
                                    </Badge>
                                </div>
                            )}
                            <p className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 text-center">
                                {goal}
                            </p>
                            {loading && <LoadingGoalText />}
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="sm:size-lg p-1 sm:p-2 dark:text-gray-300"
                    onClick={() => navigateStep('next')}
                    disabled={currentStepIndex >= goalSteps.length - 1}
                >
                    <ChevronRightIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                    Step {currentStepIndex + 1}/{goalSteps.length}
                </span>

                {isManualEditing ? (
                    <div className="space-x-2 sm:space-x-3 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:size-lg dark:bg-gray-700 dark:text-gray-200"
                            onClick={() => {
                                setIsManualEditing(false);
                                setManualGoal(goal);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="sm:size-lg dark:bg-blue-600 dark:hover:bg-blue-700"
                            onClick={handleManualEditSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="sm:size-lg dark:bg-gray-700 dark:text-gray-200 order-1 sm:order-2"
                        onClick={() => setIsManualEditing(true)}
                    >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        Edit Goal
                    </Button>
                )}
            </div>
        </div>
    );
};