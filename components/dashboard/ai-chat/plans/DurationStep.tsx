import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from "date-fns";
import { PlanData } from '@/types/plan';

interface DurationStepProps {
    planData: PlanData;
    setPlanData: React.Dispatch<React.SetStateAction<PlanData>>;
}

export const DurationStep: React.FC<DurationStepProps> = ({ planData, setPlanData }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {planData.deadlineDate && (
                    <Alert>
                        <AlertTitle className='text-center'>Selected Deadline</AlertTitle>
                        <AlertDescription className='text-lg text-center'>
                            {format(planData.deadlineDate, 'PPP')}
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={planData.deadlineDate}
                        onSelect={(date) => setPlanData({ ...planData, deadlineDate: date })}
                        className="rounded-md border"
                        disabled={(date) => date < new Date()}
                    />
                </div>
            </div>
        </div>
    );
};
