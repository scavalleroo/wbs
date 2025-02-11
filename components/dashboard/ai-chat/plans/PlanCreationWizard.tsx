import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Book, Dumbbell, Utensils, Users, Plus, Palmtree, CalendarIcon } from 'lucide-react';

import { PlanTypeSelection } from './PlanTypeSelection';
import { GoalsStep } from './GoalsStep';
import NewPlanChat from './NewPlanChat';
import { PlanData } from '@/types/plan';
import { TargetDescription } from './TargetDescription';
import { DurationStep } from './DurationStep';
import { ReviewStep } from './ReviewStep';

const PlanCreationWizard = () => {
    const [step, setStep] = useState(1);
    const [openAIChat, setOpenAIChat] = useState(false);

    const [planData, setPlanData] = useState<PlanData>({
        type: '',
        customType: '',
        title: '',
        description: '',
        durationType: 'quantity',
        durationUnit: 'weeks',
        durationValue: 1,
        deadlineDate: undefined,
        goals: [],
        currentGoal: ''
    });

    const planTypes = useMemo(() => [
        { id: 'study', name: 'Study Plan', icon: Book },
        { id: 'training', name: 'Training Plan', icon: Dumbbell },
        { id: 'nutrition', name: 'Nutrition Plan', icon: Utensils },
        { id: 'vacation', name: 'Vacation Plan', icon: Palmtree },
        { id: 'team', name: 'Team Plan', icon: Users },
        { id: 'custom', name: 'Custom Plan', icon: Plus },
    ], []);

    const stepsTitle = useMemo(() => [
        'What plan do you want to create?',
        `What are the goals for the ${planData.type === 'custom' ? planData.customType : planData.type + ' plan'}?`,
        `For who is the ${planData.type === 'custom' ? planData.customType : planData.type + ' plan'}?`,
        'What is the duration of the plan?',
        'Plan summary'
    ], [planData.type, planData.customType]);

    const handlePlanTypeSelect = useCallback((type: string) => {
        setPlanData(prev => ({ ...prev, type }));
        if (type !== 'custom') {
            handleNext();
        }
    }, []);

    const handleCustomTypeChange = useCallback((value: string) => {
        setPlanData(prev => ({ ...prev, customType: value }));
    }, []);

    const handleGoalsUpdate = useCallback((goals: string[]) => {
        setPlanData(prev => ({ ...prev, goals }));
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPlanData({ ...planData, [e.target.name]: e.target.value });
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    if (openAIChat) {
        return <NewPlanChat planData={planData} />;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className='font-light text-center text-3xl'>
                    {stepsTitle[step - 1]}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {step === 1 && (
                    <PlanTypeSelection
                        planTypes={planTypes}
                        planData={planData}
                        onPlanTypeSelect={handlePlanTypeSelect}
                        onCustomTypeChange={handleCustomTypeChange}
                    />
                )}

                {step === 2 && (
                    <GoalsStep
                        planData={planData}
                        onGoalsUpdate={handleGoalsUpdate}
                    />
                )}

                {step === 3 && (
                    <TargetDescription
                        planData={planData}
                        handleInputChange={handleInputChange}
                    />
                )}

                {step === 4 && (
                    <DurationStep
                        planData={planData}
                        setPlanData={setPlanData}
                    />
                )}

                {step === 5 && (
                    <ReviewStep
                        planData={planData}
                        planTypes={planTypes}
                    />
                )}

                <div className="flex justify-between mt-8">
                    {step > 1 && (
                        <Button
                            onClick={handleBack}
                            className="flex items-center gap-2"
                            variant="outline"
                        >
                            <ChevronLeft size={16} />
                            Back
                        </Button>
                    )}
                    {step < 5 ? (
                        <Button
                            onClick={handleNext}
                            className="flex items-center gap-2 ml-auto"
                            disabled={planData.type === 'custom' && !planData.customType.trim()}
                        >
                            Next
                            <ChevronRight size={16} />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setOpenAIChat(true)}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 ml-auto"
                        >
                            Create Plan with AI
                            <Check size={16} />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PlanCreationWizard;