import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Circle, Sparkle, Sparkles } from 'lucide-react';
import { PlanOpenAI } from '@/types/plan';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusIcon = (status: any) => {
    switch (status) {
        case 'Completed':
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'In Progress':
            return <Clock className="w-5 h-5 text-blue-500" />;
        case 'Delayed':
            return <AlertCircle className="w-5 h-5 text-red-500" />;
        default:
            return <Circle className="w-5 h-5 text-gray-400" />;
    }
};

const PlanTimeline = ({ plan }: { plan: PlanOpenAI }) => {

    if (plan.loading) {
        return <div className='flex flex-col gap-4'>
            <div className='flex flex-row gap-2'>
                <Sparkles className='text-primary/50' />
                <p className='text-light'>Generating your plan...</p>
            </div>
            <Skeleton className='w-full h-8' />
            <Skeleton className='w-80 h-8' />
            <Skeleton className='w-40 h-8' />
        </div>
    }

    if (plan.error) {
        return <p className='text-red'>{plan.error}</p>
    }

    return (
        <Card className="w-full max-w-4xl mb-4">
            <CardHeader>
                <div className="flex flex-col space-y-2">
                    <CardTitle>{plan.title}</CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="outline">{plan.granularity}</Badge>
                        <Badge variant="outline">Detail: {plan.detailLevel}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{plan.goals}</p>
                    <p className="text-sm text-gray-500">Deadline: {plan.deadline}</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200" />

                    {/* Timeline items */}
                    <div className="space-y-8">
                        {plan.tasks && Object.entries(plan.tasks).map(([day, task], index) => (
                            <div key={day} className="relative flex items-start gap-6 group">
                                {/* Timeline dot and line */}
                                <div className="absolute left-7 -top-4 bottom-0 w-0.5 bg-gray-200 group-first:hidden" />
                                <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-gray-200">
                                    <span className="text-sm font-medium">{day}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <Card className="transition-all duration-200 hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium">{task.description}</p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-medium">Metric:</span>
                                                            {task.metric.value} ({task.metric.type})
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {getStatusIcon(task.status)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlanTimeline;