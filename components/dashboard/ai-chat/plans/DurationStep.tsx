import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from "date-fns";
import { Plan } from '@/types/plan';

interface DurationStepProps {
    planData: Plan;
    setPlanData: React.Dispatch<React.SetStateAction<Plan>>;
}

export const DurationStep: React.FC<DurationStepProps> = ({ planData, setPlanData }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {planData.deadline && (
                    <Alert>
                        <AlertTitle className='text-center'>Selected Deadline</AlertTitle>
                        <AlertDescription className='text-lg text-center'>
                            {format(planData.deadline, 'PPP')}
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={planData.deadline}
                        onSelect={(date) => setPlanData({ ...planData, deadline: date })}
                        className="rounded-md border"
                        disabled={(date) => date < new Date()}
                    />
                </div>
            </div>
        </div>
    );
};
