import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlanData } from '@/types/plan';

export type PlanType = {
    id: string;
    name: string;
    icon: React.ComponentType;
};

type PlanTypeSelectionProps = {
    planTypes: PlanType[];
    planData: PlanData;
    onPlanTypeSelect: (type: string) => void;
    onCustomTypeChange: (value: string) => void;
};

export const PlanTypeSelection: React.FC<PlanTypeSelectionProps> = ({
    planTypes,
    planData,
    onPlanTypeSelect,
    onCustomTypeChange
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {planTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <Button
                            key={type.id}
                            variant={planData.type === type.id ? "default" : "outline"}
                            className={`h-32 flex flex-col items-center justify-center space-y-2 p-4 ${planData.type === type.id ? '' : 'hover:bg-blue-50'}`}
                            onClick={() => onPlanTypeSelect(type.id)}
                        >
                            <Icon />
                            <span className="text-lg font-medium text-center">{type.name}</span>
                        </Button>
                    );
                })}
            </div>

            {planData.type === 'custom' && (
                <div className="space-y-4">
                    <Input
                        type="text"
                        name="customType"
                        value={planData.customType}
                        onChange={(e) => onCustomTypeChange(e.target.value)}
                        className="w-full p-4"
                        style={{ fontSize: '1.4rem' }}
                        placeholder="Describe your plan type"
                    />
                </div>
            )}
        </div>
    );
};