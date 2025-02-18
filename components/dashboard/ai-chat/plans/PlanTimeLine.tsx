import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, Circle, Sparkles, Target, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { PlanOpenAI } from '@/types/plan';

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
    const [expandedWeeks, setExpandedWeeks] = useState<{ [key: string]: boolean }>({});

    if (plan.loading) {
        return <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2">
                <Sparkles className="text-primary/50" />
                <p className="text-light dark:text-gray-300">Generating your plan...</p>
            </div>
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-80 h-8" />
            <Skeleton className="w-40 h-8" />
        </div>;
    }

    if (plan.error) {
        return <p className="text-red-500 dark:text-red-400">{plan.error}</p>;
    }

    const toggleWeek = (weekKey: string) => {
        setExpandedWeeks(prev => ({
            ...prev,
            [weekKey]: !prev[weekKey]
        }));
    };

    return (
        <Card className="w-full max-w-4xl mb-4">
            <CardHeader>
                <div className="flex flex-col space-y-2">
                    <CardTitle>{plan.title}</CardTitle>
                    <div className="flex flex-row gap-2 items-center">
                        <Target className="w-4 h-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">{plan.goals}</p>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <Calendar className="w-4 h-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">{plan.deadline}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-8">
                        {plan.tasks && Object.entries(plan.tasks).map(([period, task], index) => {
                            const [weekLabel, dateRange] = period.split(' (');
                            const dates = dateRange ? dateRange.replace(')', '') : '';

                            return (
                                <div key={period} className="relative flex items-start gap-6 group">
                                    <div className="absolute left-7 -top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 group-first:hidden" />
                                    <div className="relative z-10 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{weekLabel.split(' ')[0]}</span>
                                        <span className="text-sm font-bold dark:text-gray-200">{weekLabel.split(' ')[1]}</span>
                                    </div>

                                    <div className="flex-1">
                                        <Card className="transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{dates}</p>
                                                                    <p className="font-medium mt-1 dark:text-gray-200">{task.description}</p>
                                                                </div>
                                                                {task.daily_tasks && (
                                                                    <button
                                                                        onClick={() => toggleWeek(period)}
                                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                                    >
                                                                        {expandedWeeks[period] ?
                                                                            <ChevronUp className="w-4 h-4" /> :
                                                                            <ChevronDown className="w-4 h-4" />
                                                                        }
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {task.daily_tasks && expandedWeeks[period] && (
                                                            <div className="mt-4 space-y-2">
                                                                {Object.entries(task.daily_tasks).map(([day, description]) => {
                                                                    const [dayName, date] = day.split(' (');
                                                                    return (
                                                                        <div key={day} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                                                                            <div className="min-w-[120px] flex flex-col">
                                                                                <span className="font-medium dark:text-gray-200">{dayName}</span>
                                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {date ? date.replace(')', '') : ''}
                                                                                </span>
                                                                            </div>
                                                                            <span className="flex-1 dark:text-gray-300">{description}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <span className="font-medium dark:text-gray-300">Metric:</span>
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
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlanTimeline;