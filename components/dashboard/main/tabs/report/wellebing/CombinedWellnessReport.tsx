import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import WellnessReport from './WellnessReport';
import FocusScoreReport from './FocusScoreReport';
import 'react-circular-progressbar/dist/styles.css';
import { ScoreDisplay } from './ScoreDisplay';
import FocusSessionsReport from './FocusSessionReport';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CombinedWellnessReportProps {
    user: User | null | undefined;
}

const CombinedWellnessReport = ({ user }: CombinedWellnessReportProps) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    return (
        <div className="space-y-2">
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-8">
                <ScoreDisplay user={user} timeRange={timeRange} setTimeRange={(value) => setTimeRange(value as 'week' | 'month' | 'year')} />

                <div className='flex flex-col gap-6 w-full'>
                    {/* Focus Sessions Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium"></h2>
                            <Tabs value={timeRange} onValueChange={(value: string) => setTimeRange(value as 'week' | 'month' | 'year')} className="w-auto">
                                <TabsList className="bg-neutral-100 dark:bg-neutral-800">
                                    <TabsTrigger
                                        value="week"
                                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                                    >
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="month"
                                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                                    >
                                        Month
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="year"
                                        className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                                    >
                                        Year
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <FocusSessionsReport
                            user={user}
                            timeRange={timeRange === 'year' ? 'all' : timeRange}
                        />
                    </div>

                    {/* Focus Score Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium"></h2>
                            <Tabs value={timeRange} onValueChange={(value: string) => setTimeRange(value as 'week' | 'month' | 'year')} className="w-auto">
                                <TabsList className="bg-neutral-100 dark:bg-neutral-800">
                                    <TabsTrigger
                                        value="week"
                                        className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                                    >
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="month"
                                        className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                                    >
                                        Month
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="year"
                                        className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                                    >
                                        Year
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <FocusScoreReport
                            user={user}
                            compactMode={true}
                            timeRange={timeRange}
                        />
                    </div>

                    {/* Wellness Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium"></h2>
                            <Tabs value={timeRange} onValueChange={(value: string) => setTimeRange(value as 'week' | 'month' | 'year')} className="w-auto">
                                <TabsList className="bg-neutral-100 dark:bg-neutral-800">
                                    <TabsTrigger
                                        value="week"
                                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                                    >
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="month"
                                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                                    >
                                        Month
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="year"
                                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                                    >
                                        Year
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <WellnessReport
                            user={user}
                            compactMode={true}
                            timeRange={timeRange}
                            hideTitle={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CombinedWellnessReport;