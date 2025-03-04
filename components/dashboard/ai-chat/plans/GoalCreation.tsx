import { ApiResponse, GoalStep, SmartPlan } from '@/types/plan';
import { OpenAIService } from '@/utils/openai-service';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import NewPlanChat from './NewPlanChat';
import { ResponsiveDatePicker } from './components/ResposiveDatePicker';
import { GoalCard } from './components/GoalCard';
import { InputInterface } from './components/InputInterface';
import { GenerateAIButton } from './components/GenerateAIButton';
import { LoadingGoalText, LoadingInput } from './components/LoadingGoalsText';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const SmartGoalCreator: React.FC = () => {
    const [targetDate, setTargetDate] = useState<Date | undefined>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;
    });
    const [goal, setGoal] = useState<string>('');
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [userInput, setUserInput] = useState<string>('');
    const [userSelect, setUserSelect] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [goalSteps, setGoalSteps] = useState<GoalStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isManualEditing, setIsManualEditing] = useState<boolean>(false);
    const [manualGoal, setManualGoal] = useState<string>('');
    const openAIService = OpenAIService.getInstance(true);
    const [openAIChat, setOpenAIChat] = useState(false);
    const [smartPlan, setSmartPlan] = useState<SmartPlan | null>(null);

    // Modify handleTargetDateChange to not send the query
    const handleTargetDateChange = (date: Date | undefined) => {
        if (date) {
            setTargetDate(date);
            const formattedDate = format(date, 'PPP');
            const initialGoal = `By ${formattedDate}, I aim to`;
            setGoal(initialGoal);
            setUserInput(initialGoal);
            setManualGoal(initialGoal);

            // Set the initial goal step without submitting
            setGoalSteps([{
                text: initialGoal,
                value: formattedDate,
                type: 'date'
            }]);

        }
    };

    // Create a new function to handle the Next button click
    const handleNextButtonClick = async () => {
        if (!targetDate) return;

        const formattedDate = format(targetDate, 'PPP');
        const combinedGoal = `By ${formattedDate}, I aim to ${userInput}`;

        setLoading(true);
        try {
            await handleSubmit(combinedGoal);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInput(e.target.value);
    };

    const handleOptionSelect = (value: string) => {
        setUserSelect(value);
        if (value !== 'other') {
            setUserInput(value);
        } else {
            setUserInput('');
        }
    };

    const handleManualEditSubmit = async () => {
        setLoading(true);
        try {
            const fullResponse = await openAIService.sendMessage(
                JSON.stringify({ goal: manualGoal, userInput: manualGoal }),
                (content) => {
                    console.log('Stream update:', content);
                }
            );

            const data: ApiResponse = JSON.parse(fullResponse);
            setApiResponse(data);
            setGoal(manualGoal);
            setIsManualEditing(false);
        } catch (error) {
            console.error('Error updating goal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (initialGoal?: string) => {
        setLoading(true);
        try {
            setGoal(goal.replace(`[${apiResponse?.otherPlaceholder}]`, userInput));

            const message = initialGoal ?
                JSON.stringify({ goal: initialGoal ? initialGoal : goal, userInput, currentDate: format(new Date(), 'PPP') })
                :
                JSON.stringify({ userInput });

            const fullResponse = await openAIService.sendMessage(
                message,
                (content) => {
                    console.log('Stream update:', content);
                }
            );

            console.log('Full response:', fullResponse);

            const data: ApiResponse = JSON.parse(fullResponse);
            setApiResponse(data);

            if (data.isComplete && data.completeGoal) {
                setGoal(data.nextText);
                setManualGoal(data.nextText);

                const newSteps = [...goalSteps, {
                    text: data.completeGoal,
                    value: userInput,
                    type: data.type,
                    options: data.options,
                    otherPlaceholder: ""
                }];
                setGoalSteps(newSteps);
                // Automatically advance to the new step
                setCurrentStepIndex(newSteps.length - 1);
            } else {
                setGoal(data.nextText);
                setManualGoal(data.nextText);

                if (userInput) {
                    const newSteps = [...goalSteps, {
                        text: goal,
                        value: userInput,
                        type: data.type,
                        options: data.options,
                        otherPlaceholder: data.otherPlaceholder
                    }];
                    setGoalSteps(newSteps);
                    // Automatically advance to the new step
                    setCurrentStepIndex(newSteps.length - 1);
                }
            }
            setUserInput('');
            setUserSelect('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateStep = (direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev' ? currentStepIndex - 1 : currentStepIndex + 1;
        if (newIndex >= 0 && newIndex < goalSteps.length) {
            setCurrentStepIndex(newIndex);
            setGoal(goalSteps[newIndex].text);
            setManualGoal(goalSteps[newIndex].text);

            // Only set new API response for steps we haven't completed yet
            if (newIndex === goalSteps.length - 1) {
                setApiResponse({
                    type: goalSteps[newIndex].type,
                    nextText: goalSteps[newIndex].text,
                    options: goalSteps[newIndex].options,
                    otherPlaceholder: goalSteps[newIndex].otherPlaceholder,
                    isComplete: false
                });
            } else {
                // For previous steps, we don't want to show the input interface
                setApiResponse(null);
            }
        }
    };

    const shouldShowInputInterface = () => {
        return currentStepIndex === goalSteps.length - 1 && apiResponse && !apiResponse.isComplete;
    };

    useEffect(() => {
        if (smartPlan) {
            setOpenAIChat(true);
        }
    }, [smartPlan]);

    useEffect(() => {
        console.log('Goal:', goal);
    }, [goal]);

    if (openAIChat && smartPlan) {
        return <NewPlanChat smartPlan={smartPlan} />;
    }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto">
                <div className="space-y-6">
                    {/* Date Picker (shown only when no goal is set) */}
                    {!goal && (
                        <div>
                            <div className="space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-6 shadow-sm mb-4">
                                <div className="flex flex-col items-center justify-center">
                                    {!loading && (
                                        <h1 className='font-bold hover:text-zinc-950 dark:hover:text-white mb-4 text-lg'>Define your goal</h1>
                                    )}

                                    <ResponsiveDatePicker
                                        targetDate={targetDate!}
                                        handleTargetDateChange={handleTargetDateChange}
                                        goal={userInput}
                                        handleGoalChange={(goalText) => setUserInput(goalText)}
                                        isLoading={loading}
                                        handleSubmit={handleNextButtonClick}
                                    />

                                    {loading && (
                                        <div className='mt-4 w-full flex flex-col items-center justify-center gap-4'>
                                            <LoadingGoalText />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleNextButtonClick}
                                disabled={loading || !targetDate || !userInput}
                                size="default"
                                className="sm:size-lg w-full text-base sm:text-lg dark:bg-blue-600 dark:hover:bg-blue-700 mt-4"
                            >
                                <Sparkles className="h-6 w-6 mr-2" />
                                {loading ? 'Generating the next step...' : 'Next'}
                            </Button>

                        </div>
                    )}


                    {/* Goal Card (shown when a goal is set) */}
                    {goal && (
                        <GoalCard
                            goal={goal}
                            manualGoal={manualGoal}
                            isManualEditing={isManualEditing}
                            setIsManualEditing={setIsManualEditing}
                            setManualGoal={setManualGoal}
                            currentStepIndex={currentStepIndex}
                            goalSteps={goalSteps}
                            apiResponse={apiResponse}
                            loading={loading}
                            navigateStep={navigateStep}
                            handleManualEditSubmit={handleManualEditSubmit}
                        />
                    )}

                    {/* Input Interface (shown when appropriate) */}
                    {shouldShowInputInterface() && !isManualEditing && (
                        <InputInterface
                            loading={loading}
                            apiResponse={apiResponse!}
                            userSelect={userSelect}
                            userInput={userInput}
                            handleOptionSelect={handleOptionSelect}
                            handleInputChange={handleInputChange}
                            handleSubmit={handleSubmit}
                        />
                    )}

                    {/* Generate AI Button (shown when goal is complete) */}
                    {apiResponse?.isComplete && (
                        <GenerateAIButton
                            setSmartPlan={setSmartPlan}
                            goal={goal}
                            targetDate={targetDate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartGoalCreator;