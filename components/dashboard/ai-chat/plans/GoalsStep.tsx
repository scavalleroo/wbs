import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PlanData } from '@/types/plan';

type GoalsStepProps = {
    planData: PlanData;
    onGoalsUpdate: (goals: string[]) => void;
};

export const GoalsStep: React.FC<GoalsStepProps> = ({ planData, onGoalsUpdate }) => {
    const [currentGoal, setCurrentGoal] = useState('');

    const handleAddGoal = () => {
        if (currentGoal.trim()) {
            const newGoals = [...planData.goals, currentGoal.trim()];
            onGoalsUpdate(newGoals);
            setCurrentGoal('');
        }
    };

    const handleRemoveGoal = (indexToRemove: number) => {
        const newGoals = planData.goals.filter((_, index) => index !== indexToRemove);
        onGoalsUpdate(newGoals);
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={currentGoal}
                        onChange={(e) => setCurrentGoal(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddGoal();
                            }
                        }}
                        className="flex-1 p-4 border rounded"
                        style={{ fontSize: '1.4rem' }}
                        placeholder={`Goal number ${planData.goals.length + 1}`}
                    />
                    <Button
                        onClick={handleAddGoal}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add
                    </Button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {planData.goals.map((goal, index) => (
                    <div
                        key={index}
                        className="group relative flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <span className="text-sm font-medium">{goal}</span>
                        <button
                            onClick={() => handleRemoveGoal(index)}
                            className="absolute top-0 right-0 mt-[-8px] mr-[-4px] text-gray-500 hover:text-gray-700 bg-secondary rounded-full p-1"
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};