import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingGoalText = () => (
    <div className="flex flex-col items-center space-x-2 sm:space-x-4 gap-1 w-full">
        <span className='text-sm sm:text-base text-primary/70'>Generating the next step...</span>
        <div className="space-y-1 sm:space-y-2 shrink-0 flex-1">
            <Skeleton className="h-4 sm:h-5 w-40 sm:w-56" />
            <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
        </div>
    </div>
);

export const LoadingInput = () => (
    <div className="space-y-3 sm:space-y-4 w-full">
        <Skeleton className="h-10 sm:h-12 w-full" />
        <Skeleton className="h-10 sm:h-12 w-32" />
    </div>
);