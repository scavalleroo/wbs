import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function NotesLoading() {
    // Randomly show daily or project layout for variety
    const showDailyLayout = Math.random() > 0.5;

    return (
        <div className="w-full h-full py-2">
            <div className="max-w-screen-lg mx-auto w-full h-full">
                <Card className="rounded-lg bg-transparent text-card-foreground h-full overflow-auto border-none">
                    <div className="flex flex-col w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-700 relative">

                        {/* Header with gradient background - matching RealtimeEditor */}
                        <div className="border-b border-gray-200 dark:border-gray-700 shadow-lg" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                            minHeight: '80px'
                        }}>
                            <div className="px-4 py-4">
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    {/* Tab selection skeleton - vertical on desktop, horizontal on mobile */}
                                    <div className="flex items-center justify-center lg:justify-start flex-shrink-0">
                                        <div className="flex flex-row lg:flex-col gap-1 lg:gap-2">
                                            <Skeleton className={`h-10 w-[90px] sm:w-[120px] lg:w-[140px] rounded-xl ${showDailyLayout ? 'bg-white/30' : 'bg-white/15'}`} />
                                            <Skeleton className={`h-10 w-[65px] sm:w-[80px] lg:w-[140px] rounded-xl ${!showDailyLayout ? 'bg-white/30' : 'bg-white/15'}`} />
                                        </div>
                                    </div>

                                    {/* Navigation content skeleton - takes remaining space */}
                                    <div className="flex-1 min-w-0">
                                        {showDailyLayout ? (
                                            // Daily tab navigation - updated to match new layout
                                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full">
                                                {/* Date carousel navigation */}
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <Skeleton className="h-3 w-20 bg-white/15" />
                                                    <div className="flex items-center justify-center">
                                                        <div className="flex items-center gap-1 w-full">
                                                            <Skeleton className="h-8 w-8 rounded-lg bg-white/20 flex-shrink-0" />
                                                            <div className="flex gap-0.5 sm:gap-1 flex-1 justify-center px-1">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Skeleton key={i} className={`h-14 sm:h-16 flex-1 min-w-[2.5rem] sm:min-w-[3.5rem] rounded-lg ${i === 2 ? 'bg-white/40' : 'bg-white/20'}`} />
                                                                ))}
                                                            </div>
                                                            <Skeleton className="h-8 w-8 rounded-lg bg-white/20 flex-shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date navigation actions - Pick Date and Today buttons */}
                                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                    <Skeleton className="h-9 w-16 sm:w-20 rounded-lg bg-white/20" />
                                                    <Skeleton className="h-9 w-16 sm:w-16 rounded-lg bg-white/20" />
                                                </div>
                                            </div>
                                        ) : (
                                            // Project tab navigation - improved layout with add button in dropdown
                                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full">
                                                {/* Current page selector */}
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <Skeleton className="h-3 w-20 bg-white/15" />
                                                    <Skeleton className="h-10 w-full sm:max-w-xs rounded-lg bg-white/20" />
                                                </div>

                                                {/* Action buttons - rename/delete buttons */}
                                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                    <Skeleton className="h-9 w-16 sm:w-20 rounded-lg bg-white/20" />
                                                    <Skeleton className="h-9 w-16 sm:w-18 rounded-lg bg-white/20" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editor content area */}
                        <div className="flex flex-col flex-grow overflow-auto p-6 space-y-4">
                            {/* Simulate editor content with multiple paragraphs */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full animate-pulse" />
                                <Skeleton className="h-4 w-[90%] animate-pulse" style={{ animationDelay: '0.1s' }} />
                                <Skeleton className="h-4 w-[95%] animate-pulse" style={{ animationDelay: '0.2s' }} />
                            </div>

                            <div className="space-y-3">
                                <Skeleton className="h-4 w-[85%] animate-pulse" style={{ animationDelay: '0.3s' }} />
                                <Skeleton className="h-4 w-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                <Skeleton className="h-4 w-[80%] animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </div>

                            <div className="space-y-3">
                                <Skeleton className="h-4 w-[95%] animate-pulse" style={{ animationDelay: '0.6s' }} />
                                <Skeleton className="h-4 w-[88%] animate-pulse" style={{ animationDelay: '0.7s' }} />
                            </div>

                            {/* Simulate some larger content blocks */}
                            <div className="mt-6 space-y-4">
                                <Skeleton className="h-20 w-full rounded-md animate-pulse" style={{ animationDelay: '0.8s' }} />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[70%] animate-pulse" style={{ animationDelay: '0.9s' }} />
                                    <Skeleton className="h-4 w-[85%] animate-pulse" style={{ animationDelay: '1s' }} />
                                    <Skeleton className="h-4 w-[60%] animate-pulse" style={{ animationDelay: '1.1s' }} />
                                </div>
                            </div>
                        </div>

                        {/* Footer - matching RealtimeEditor footer */}
                        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900/50 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-4 w-[120px]" />
                            </div>

                            {/* Right side action buttons skeleton */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}