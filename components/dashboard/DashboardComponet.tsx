'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import WellnessHistory from './wellebing/WellnessHistory';
import DigitalWellbeingHistory from './wellebing/DigitalWellbeingHistory';
import 'react-circular-progressbar/dist/styles.css';
import { DashboardScore } from './wellebing/DashboardScore';
import FocusSessionsHistory from './wellebing/FocusSessionsHistory';

interface DashboardComponetProps {
    user: User | null | undefined;
}

const DashboardComponet = ({ user }: DashboardComponetProps) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    return (
        <div className="space-y-2 py-2">
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-8">
                <DashboardScore user={user} timeRange={timeRange} setTimeRange={(value) => setTimeRange(value as 'week' | 'month' | 'year')} />

                <div className='flex flex-col gap-6 w-full'>
                    {/* Focus Sessions Report */}
                    <FocusSessionsHistory
                        user={user}
                        timeRange={timeRange === 'year' ? 'all' : timeRange}
                    />

                    {/* Focus Score Report */}
                    <DigitalWellbeingHistory
                        user={user}
                        compactMode={true}
                        timeRange={timeRange}
                    />

                    <WellnessHistory
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

export default DashboardComponet;