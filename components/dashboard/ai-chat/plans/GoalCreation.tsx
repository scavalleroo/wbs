import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { OpenAIService } from '@/utils/openai-service';
import { format, isBefore, startOfToday } from 'date-fns';
import { ArrowRightIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

interface ApiResponse {
    type: 'text' | 'date';
    nextText: string;
    options?: string[];
    otherPlaceholder?: string;
    isComplete: boolean;
    completeGoal?: string;
}

interface GoalStep {
    text: string;
    value: string;
    type: 'text' | 'date';
    options?: string[];
    otherPlaceholder?: string;
}

const SmartGoalCreator: React.FC = () => {
    const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
    const [goal, setGoal] = useState<string>('');
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [userInput, setUserInput] = useState<string>('');
    const [userSelect, setUserSelect] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [goalSteps, setGoalSteps] = useState<GoalStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isManualEditing, setIsManualEditing] = useState<boolean>(false);
    const [manualGoal, setManualGoal] = useState<string>('');
    const openAIService = OpenAIService.getInstance();
    const [openAIChat, setOpenAIChat] = useState(false);

    const handleTargetDateChange = async (date: Date | undefined) => {
        if (date) {
            setTargetDate(date);
            const formattedDate = format(date, 'PPP');
            const initialGoal = `By ${formattedDate}`;
            setGoal(initialGoal);
            setUserInput(initialGoal);
            setManualGoal(initialGoal);

            setGoalSteps([{
                text: initialGoal,
                value: formattedDate,
                type: 'date'
            }]);

            await handleSubmit(initialGoal);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserInput(e.target.value);
    };

    const handleManualGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setManualGoal(e.target.value);
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
            const messageGoal = initialGoal || goal;
            setGoal(messageGoal);
            const fullResponse = await openAIService.sendMessage(
                JSON.stringify({ goal: messageGoal, userInput, currentDate: format(new Date(), 'PPP') }),
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

    const renderSelectOptions = () => {
        return (
            <Select key="options-select" onValueChange={handleOptionSelect} value={userSelect}>
                <SelectTrigger>
                    <SelectValue placeholder={apiResponse!.otherPlaceholder ?? "Select an option"} className='text-muted' />
                </SelectTrigger>
                <SelectContent>
                    {apiResponse?.options?.map((option, index) => (
                        <SelectItem key={index} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    const LoadingGoalText = () => (
        <div className="flex items-center space-x-4">
            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );

    const LoadingInput = () => (
        <div className="space-y-4 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
        </div>
    );

    return (
        <div className="space-y-4 mx-auto w-full max-w-md">
            {!goal && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">By</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-8 text-left font-normal bg-white">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {targetDate ? format(targetDate, 'PPP') : "Select the target date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={targetDate}
                                onSelect={handleTargetDateChange}
                                disabled={(date) => isBefore(date, startOfToday())}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {goal && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateStep('prev')}
                            disabled={currentStepIndex === 0}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 mx-4">
                            {isManualEditing ? (
                                <Textarea
                                    value={manualGoal}
                                    onChange={(e) => setManualGoal(e.target.value)}
                                    className="w-full min-h-[100px] resize-none"
                                    placeholder="Edit your goal..."
                                />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-base">{goal}</p>
                                    {loading && <LoadingGoalText />}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateStep('next')}
                            disabled={currentStepIndex >= goalSteps.length - 1}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            Step {currentStepIndex + 1}/{goalSteps.length}
                        </span>

                        {isManualEditing ? (
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsManualEditing(false);
                                        setManualGoal(goal);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
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
                                onClick={() => setIsManualEditing(true)}
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit Goal
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {apiResponse && apiResponse.isComplete && (
                <p className="text-green-600 font-medium">{apiResponse.completeGoal}</p>
            )}

            {shouldShowInputInterface() && !isManualEditing && (
                <div className="space-y-4">
                    {loading ? (
                        <LoadingInput />
                    ) : (
                        <>
                            {apiResponse?.type === 'text' ? (
                                <div className="space-y-2">
                                    {apiResponse.options && renderSelectOptions()}
                                    {userSelect === 'other' && (
                                        <Input
                                            type="text"
                                            value={userInput}
                                            onChange={handleInputChange}
                                            placeholder={apiResponse.otherPlaceholder}
                                        />
                                    )}
                                </div>
                            ) : (
                                <Input
                                    type="date"
                                    value={userInput}
                                    onChange={handleInputChange}
                                />
                            )}
                            <Button onClick={() => handleSubmit()} disabled={loading}>
                                {loading ? 'Processing...' : 'Next'}
                            </Button>
                        </>
                    )}
                </div>
            )}

            {apiResponse?.isComplete && (
                <Button
                    onClick={() => setOpenAIChat(true)}
                >
                    <Sparkles size={16} />
                    Generate plan with AI
                </Button>
            )}
        </div>
    );
};

export default SmartGoalCreator;