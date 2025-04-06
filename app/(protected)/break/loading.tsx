import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function RelaxLoading() {
    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>

                {/* Timer Card */}
                <Card className="w-full p-6 flex flex-col items-center space-y-6">
                    {/* Timer Display */}
                    <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="h-6 w-[150px]" />
                        <Skeleton className="h-[280px] w-[280px] rounded-full" />
                    </div>

                    {/* Timer Controls */}
                    <div className="flex space-x-4 items-center justify-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </Card>

                {/* Breathe Exercise or Technique Options */}
                <Card className="w-full p-6 space-y-4">
                    <Skeleton className="h-6 w-[140px]" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-4 space-y-3">
                                <Skeleton className="h-5 w-[80%]" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-8 w-[60%] mx-auto" />
                            </Card>
                        ))}
                    </div>
                </Card>

                {/* Tips Section */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-[120px]" />
                    <Card className="p-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[80%]" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}