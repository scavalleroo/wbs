import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';
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
            <RadioGroup
                value={planData.durationType}
                onValueChange={(value: 'quantity' | 'deadline') =>
                    setPlanData({ ...planData, durationType: value })}
                className="grid grid-cols-2 gap-4 mb-6"
            >
                <div>
                    <RadioGroupItem value="quantity" id="quantity" className="peer sr-only" />
                    <Label
                        htmlFor="quantity"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                    >
                        <span className="text-sm font-medium">Set Duration</span>
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="deadline" id="deadline" className="peer sr-only" />
                    <Label
                        htmlFor="deadline"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                    >
                        <span className="text-sm font-medium">Set Deadline</span>
                    </Label>
                </div>
            </RadioGroup>

            {planData.durationType === 'quantity' && (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                type="number"
                                min="1"
                                value={planData.durationValue}
                                onChange={(e) => setPlanData({
                                    ...planData,
                                    durationValue: parseInt(e.target.value) || 1
                                })}
                                className="w-full p-4 text-lg text-center"
                                style={{ fontSize: '1.4rem' }}
                            />
                        </div>
                        <div className="flex-1">
                            <Select
                                value={planData.durationUnit}
                                onValueChange={(value: 'days' | 'weeks' | 'months') =>
                                    setPlanData({ ...planData, durationUnit: value })}
                            >
                                <SelectTrigger className="w-full p-2 bg-secondary text-secondary-foreground border rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {planData.durationType === 'deadline' && (
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={planData.deadlineDate}
                            onSelect={(date) => setPlanData({ ...planData, deadlineDate: date })}
                            className="rounded-md border"
                            disabled={(date) => date < new Date()}
                        />
                    </div>
                    {planData.deadlineDate && (
                        <Alert>
                            <AlertTitle className='font-bold'>Selected Deadline</AlertTitle>
                            <AlertDescription className='text-lg'>
                                {format(planData.deadlineDate, 'PPP')}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
};