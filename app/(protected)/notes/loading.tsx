import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function NotesLoading() {
    return (
        <div className="p-6 space-y-6 w-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-[120px]" />
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-10" />
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Card key={i} className="p-4 space-y-3 overflow-hidden">
                        <Skeleton className="h-6 w-[80%]" />
                        <Skeleton className="h-[100px] w-full" />
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-[60px]" />
                            <div className="flex space-x-1">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-10 rounded-md" />
                    ))}
                </div>
            </div>
        </div>
    );
}