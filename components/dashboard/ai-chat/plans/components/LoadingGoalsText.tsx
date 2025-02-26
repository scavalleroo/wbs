import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export const LoadingGoalText = () => (
    <div className="flex flex-col w-full gap-1">
        <div className="space-y-1 sm:space-y-2 w-full flex flex-row justify-center">
            <Loader2 className="h-8 w-8 animate-spin text=g" />
        </div>
    </div>
);

export const LoadingInput = () => (
    <div className="space-y-3 sm:space-y-4 w-full">
        <Skeleton className="h-8 sm:h-12 w-full" />
    </div>
);