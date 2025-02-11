import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { PlanData } from '@/types/plan';

interface TargetDescriptionProps {
    planData: PlanData;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TargetDescription: React.FC<TargetDescriptionProps> = ({ planData, handleInputChange }) => {
    return (
        <div className="space-y-4">
            <Textarea
                name="description"
                value={planData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded p-4"
                style={{ fontSize: '1rem', lineHeight: '1.2' }}
                placeholder={`Describe your readiness for ${planData.goals.join(', ').toLocaleLowerCase()}`}
                rows={4}
            />
        </div>
    );
};