import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiResponse, GoalStep, SmartPlan } from '@/types/plan';
import { OpenAIService } from '@/utils/openai-service';
import { format, isBefore, startOfToday } from 'date-fns';
import { ArrowRightIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import NewPlanChat from './NewPlanChat';
import { Badge } from '@/components/ui/badge';

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
    const openAIService = OpenAIService.getInstance(true);
    const [openAIChat, setOpenAIChat] = useState(false);
    const [smartPlan, setSmartPlan] = useState<SmartPlan | null>(null);

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
            setGoal(messageGoal.replace(`[${apiResponse?.otherPlaceholder}]`, userInput));
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

    const LoadingGoalText = () => (
        <div className="flex flex-col items-center space-x-4 gap-1 w-full">
            <span className='text-primary/70'>Generating the next step...</span>
            <div className="space-y-2 shrink-0 flex-1">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-5 w-40" />
            </div>
        </div>
    );

    const LoadingInput = () => (
        <div className="space-y-4 w-full">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-32" />
        </div>
    );

    useEffect(() => {
        if (smartPlan) {
            setOpenAIChat(true);
        }
    }, [smartPlan]);

    if (openAIChat && smartPlan) {
        return (
            <NewPlanChat smartPlan={smartPlan} />
        );
    }

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {!goal && (
                        <div className="flex items-center gap-3 justify-center">
                            <span className="text-lg font-medium dark:text-gray-200">By</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 text-left font-normal bg-white dark:bg-gray-800 dark:text-gray-200">
                                        <CalendarIcon className="mr-2 h-5 w-5" />
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
                                        className="dark:bg-gray-800 dark:text-gray-200"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {goal && (
                        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => navigateStep('prev')}
                                    disabled={currentStepIndex === 0}
                                    className="dark:text-gray-300"
                                >
                                    <ChevronLeftIcon className="h-6 w-6" />
                                </Button>
                                <div className="flex-1 mx-6">
                                    {isManualEditing ? (
                                        <Textarea
                                            value={manualGoal}
                                            onChange={(e) => setManualGoal(e.target.value)}
                                            className="w-full min-h-[120px] resize-none text-lg dark:bg-gray-700 dark:text-gray-200"
                                            placeholder="Edit your goal..."
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {apiResponse && apiResponse.isComplete && (
                                                <div className="flex items-center justify-center space-x-2 mb-8">
                                                    <Badge className="text-white text-base bg-green-600 font-medium px-4">
                                                        Ready to generate the plan!
                                                    </Badge>
                                                </div>
                                            )}
                                            <p className="text-xl font-medium text-gray-900 dark:text-gray-100 text-center">
                                                {goal}
                                            </p>
                                            {loading && <LoadingGoalText />}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => navigateStep('next')}
                                    disabled={currentStepIndex >= goalSteps.length - 1}
                                    className="dark:text-gray-300"
                                >
                                    <ChevronRightIcon className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-base text-gray-600 dark:text-gray-400">
                                    Step {currentStepIndex + 1}/{goalSteps.length}
                                </span>

                                {isManualEditing ? (
                                    <div className="space-x-3">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => {
                                                setIsManualEditing(false);
                                                setManualGoal(goal);
                                            }}
                                            className="dark:bg-gray-700 dark:text-gray-200"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={handleManualEditSubmit}
                                            disabled={loading}
                                            className="dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setIsManualEditing(true)}
                                        className="dark:bg-gray-700 dark:text-gray-200"
                                    >
                                        <PencilIcon className="h-5 w-5 mr-2" />
                                        Edit Goal
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {shouldShowInputInterface() && !isManualEditing && (
                        <div className="space-y-4">
                            {loading ? (
                                <LoadingInput />
                            ) : (
                                <div className="space-y-4">
                                    {apiResponse?.type === 'text' ? (
                                        <div className="space-y-3">
                                            {apiResponse.options && (
                                                <Select onValueChange={handleOptionSelect} value={userSelect}>
                                                    <SelectTrigger className="w-full h-12 text-lg dark:bg-gray-700 dark:text-gray-200">
                                                        <SelectValue className='text-primary/60' placeholder={apiResponse.otherPlaceholder ? apiResponse.otherPlaceholder.charAt(0).toUpperCase() + apiResponse.otherPlaceholder.slice(1) : "Select an option"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-gray-800">
                                                        {apiResponse.options.map((option, index) => (
                                                            <SelectItem key={index} value={option}>
                                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {userSelect === 'other' && (
                                                <Input
                                                    type="text"
                                                    value={userInput}
                                                    onChange={handleInputChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSubmit();
                                                        }
                                                    }}
                                                    placeholder={apiResponse.otherPlaceholder!.charAt(0).toUpperCase() + apiResponse.otherPlaceholder!.slice(1)}
                                                    className="h-12 text-lg dark:bg-gray-700 dark:text-gray-200"
                                                    style={{ fontSize: '1.1rem' }}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <Input
                                            type="date"
                                            value={userInput}
                                            onChange={handleInputChange}
                                            className="h-12 text-lg dark:bg-gray-700 dark:text-gray-200"
                                        />
                                    )}
                                    <Button
                                        onClick={() => handleSubmit()}
                                        disabled={loading}
                                        size="lg"
                                        className="w-full text-lg dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        {loading ? 'Processing...' : 'Next'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {apiResponse?.isComplete && (
                        <Button
                            onClick={() => setSmartPlan({
                                text: goal,
                                end_date: targetDate
                            })}
                            size="lg"
                            className="w-full text-lg text-white bg-purple-800 hover:bg-purple-900"
                        >
                            <Sparkles size={20} className="mr-2" />
                            Generate plan with AI
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartGoalCreator;