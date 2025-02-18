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
                {planData.end_date && (
                    <Alert>
                        <AlertTitle className='text-center'>Selected Deadline</AlertTitle>
                        <AlertDescription className='text-lg text-center'>
                            {format(planData.end_date, 'PPP')}
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={planData.end_date}
                        onSelect={(date) => setPlanData({ ...planData, end_date: date })}
                        className="rounded-md border"
                        disabled={(date) => date < new Date()}
                    />
                </div>
            </div>
        </div>
    );
};
