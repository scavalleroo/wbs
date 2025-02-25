import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { SmartPlan } from '@/types/plan';

interface GenerateAIButtonProps {
    setSmartPlan: React.Dispatch<React.SetStateAction<SmartPlan | null>>;
    goal: string;
    targetDate: Date | undefined;
}

export const GenerateAIButton = ({ setSmartPlan, goal, targetDate }: GenerateAIButtonProps) => {
    return (
        <Button
            onClick={() => setSmartPlan({
                text: goal,
                end_date: targetDate
            })}
            size="default"
            className="sm:size-lg w-full text-base sm:text-lg text-white bg-purple-800 hover:bg-purple-900"
        >
            <Sparkles size={16} className="sm:size-20 mr-1 sm:mr-2" />
            Generate plan with AI
        </Button>
    );
};