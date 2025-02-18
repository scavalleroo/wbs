"use client";

import { Plan } from "@/types/plan";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/utils/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function PlansDisplay() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    console.log('No user found');
                    return;
                }

                const { data, error } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching plans:', error);
                    return;
                }

                setPlans(data || []);
            } catch (error) {
                console.error('Error in fetchPlans:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDuration = (plan: Plan) => {
        return `Due ${plan.deadline ?
            format(plan.deadline, 'PPP') : 'No deadline'}`;
    };

    if (isLoading) {
        return (
            <div className="p-6 w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <Skeleton className="w-full h-80" />
                    <Skeleton className="w-full h-80" />
                    <Skeleton className="w-full h-80" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Create New Plan Card */}
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
                    onClick={() => router.push('/dashboard/plans/new')}
                >
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                        <Sparkles className="h-12 w-12 text-primary/40 mb-4 mt-2" />
                        <p className="text-lg font-medium text-primary">Generate new plan</p>
                    </CardContent>
                </Card>

                {/* Existing Plans */}
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <CardTitle className="text-xl font-bold line-clamp-2">
                                        {plan.title}
                                    </CardTitle>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {plan.goals.join(', ')}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">Progress</span>
                                        <span className="text-sm font-medium">{plan.progress}%</span>
                                    </div>
                                    <Progress value={plan.progress} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDuration(plan)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end items-center">
                            {/* <Badge variant="outline">{plan.status}</Badge> */}
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}