import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TimeRange = 'week' | 'month' | 'year' | 'all';

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
    allowAll?: boolean;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
    value,
    onChange,
    allowAll = false
}) => {
    return (
        <Tabs
            value={value}
            onValueChange={(value) => onChange(value as TimeRange)}
            className="w-auto"
        >
            <TabsList className="bg-white/10 border border-white/20 p-0.5 h-auto min-h-0">
                <TabsTrigger
                    value="week"
                    className="text-xs sm:text-sm text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white px-2 sm:px-3 py-0.5 sm:py-1 h-auto"
                >
                    W
                    <span className="hidden sm:inline">eek</span>
                </TabsTrigger>
                <TabsTrigger
                    value="month"
                    className="text-xs sm:text-sm text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white px-2 sm:px-3 py-0.5 sm:py-1 h-auto"
                >
                    M
                    <span className="hidden sm:inline">onth</span>
                </TabsTrigger>
                <TabsTrigger
                    value="year"
                    className="text-xs sm:text-sm text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white px-2 sm:px-3 py-0.5 sm:py-1 h-auto"
                >
                    Y
                    <span className="hidden sm:inline">ear</span>
                </TabsTrigger>
                {allowAll && (
                    <TabsTrigger
                        value="all"
                        className="text-xs sm:text-sm text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white px-2 sm:px-3 py-0.5 sm:py-1 h-auto"
                    >
                        All
                    </TabsTrigger>
                )}
            </TabsList>
        </Tabs>
    );
};

export default TimeRangeSelector;