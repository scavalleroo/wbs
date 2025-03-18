import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import WellnessReport from './WellnessReport';
import FocusScoreReport from './FocusScoreReport';
import 'react-circular-progressbar/dist/styles.css';
import { ScoreDisplay } from './ScoreDisplay';

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
                    <FocusScoreReport
                        user={user}
                        compactMode={true}
                        timeRange={timeRange}
                        hideTitle={true}
                    />
                    <WellnessReport
                        user={user}
                        compactMode={true}
                        timeRange={timeRange}
                        hideTitle={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CombinedWellnessReport;