import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6 w-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-[180px]" />
                <Skeleton className="h-10 w-[120px]" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4 space-y-3">
                        <Skeleton className="h-5 w-[140px]" />
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-10 w-[100px]" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <Card className="p-5 space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-[150px]" />
                        <Skeleton className="h-8 w-[100px]" />
                    </div>
                    <Skeleton className="h-[300px] w-full" />
                </Card>

                {/* Recent Activity */}
                <Card className="p-5 space-y-4">
                    <Skeleton className="h-6 w-[120px]" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[70%]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Additional Content */}
            <Card className="p-5">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-[180px]" />
                    <Skeleton className="h-8 w-[100px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[120px] w-full rounded-md" />
                    ))}
                </div>
            </Card>
        </div>
    );
}