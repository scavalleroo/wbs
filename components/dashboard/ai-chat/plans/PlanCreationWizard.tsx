import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Book, Dumbbell, Utensils, Users, Plus, Palmtree, Sparkles } from 'lucide-react';

import { GoalsStep } from './GoalsStep';
import { Plan } from '@/types/plan';
import { TargetDescription } from './TargetDescription';
import { DurationStep } from './DurationStep';
import NewPlanChat from './NewPlanChat';

const PlanCreationWizard = () => {
    const [step, setStep] = useState(1);
    const [openAIChat, setOpenAIChat] = useState(false);

    const [planData, setPlanData] = useState<Plan>({
        id: '',
        user_id: '',
        title: '',
        user_resources: '',
        end_date: undefined,
        goals: [],
        status: 'creation',
        created_at: '',
        updated_at: '',
        thread_id: null,
        start_date: undefined
    });

    const stepsTitle = useMemo(() => [
        `What exactly do you want to achieve?`,
        `What skills do you have to make you succeed?`,
        'By when do you want to achieve this goal?',
        'Plan summary'
    ], []);

    const handleGoalsUpdate = useCallback((goals: string[]) => {
        setPlanData(prev => ({ ...prev, goals }));
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPlanData({ ...planData, [e.target.name]: e.target.value });
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    function isNextDisabled() {
        if (step === 1) {
            return planData.goals.length === 0;
        }

        if (step === 2) {
            return planData.user_resources.trim().length === 0;
        }

        if (step === 3) {
            return !planData.end_date;
        }

        return false;
    }

    if (openAIChat) {
        return <NewPlanChat planData={planData} />;
    }

    return (
        <div className='h-full flex items-center justify-center'>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className='font-light text-center text-3xl'>
                        {stepsTitle[step - 1]}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <GoalsStep
                            planData={planData}
                            onGoalsUpdate={handleGoalsUpdate}
                        />
                    )}

                    {step === 2 && (
                        <TargetDescription
                            planData={planData}
                            handleInputChange={handleInputChange}
                        />
                    )}

                    {step === 3 && (
                        <DurationStep
                            planData={planData}
                            setPlanData={setPlanData}
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

                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                className="flex items-center gap-2 ml-auto"
                                disabled={isNextDisabled()}
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setOpenAIChat(true)}
                            >
                                <Sparkles size={16} />
                                Generate plan with AI
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlanCreationWizard;