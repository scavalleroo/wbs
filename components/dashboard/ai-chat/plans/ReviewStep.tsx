import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, Users, CalendarIcon, Plus } from 'lucide-react';
import { format } from "date-fns";
import { PlanData } from '@/types/plan';
import { PlanType } from './PlanTypeSelection';

interface ReviewStepProps {
    planData: PlanData;
    planTypes: PlanType[];
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ planData, planTypes }) => {
    return (
        <div className="space-y-8">
            {/* Plan Type Header */}
            <div className="flex items-center justify-center space-x-4 p-6 bg-blue-50 rounded-lg">
                {planTypes.find(t => t.id === planData.type)?.icon && (
                    <div className="p-4 bg-white rounded-full shadow-sm">
                        {React.createElement(planTypes.find(t => t.id === planData.type)?.icon || Plus)}
                    </div>
                )}
                <h2 className="text-3xl font-medium capitalize">
                    {planData.type === 'custom' ? planData.customType : `${planData.type} Plan`}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Goals Section */}
                <Card className="col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <CardTitle>Goals</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {planData.goals.map((goal, index) => (
                                <div
                                    key={index}
                                    className="group flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full transition-colors cursor-default"
                                >
                                    <span className="text-sm font-medium">{goal}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Target Users Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <CardTitle>For</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg text-gray-700">{planData.description}</p>
                    </CardContent>
                </Card>

                {/* Duration Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                            <CardTitle>{planData.deadlineDate ? 'Deadline' : 'Duration'}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {planData.durationType === 'quantity' ? (
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-semibold text-blue-600">
                                        {planData.durationValue}
                                    </span>
                                    <span className="text-lg text-gray-600 capitalize">
                                        {planData.durationUnit}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-2xl font-semibold text-blue-600">
                                        {format(planData.deadlineDate || new Date(), 'MMMM d, yyyy')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};