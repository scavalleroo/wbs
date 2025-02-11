"use client";

import { Plan } from "@/types/plan";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PlusCircle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/utils/supabase/client";

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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDuration = (plan: Plan) => {
        if (plan.duration_type === 'deadline' && plan.deadline) {
            return `Due ${formatDate(plan.deadline)}`;
        } else if (plan.duration_type === 'quantity') {
            return `${plan.duration_value} ${plan.duration_unit}`;
        }
        return 'No duration set';
    };

    if (isLoading) {
        return <div className="p-6">Loading plans...</div>;
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
                        <PlusCircle className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-600">Create New Plan</p>
                    </CardContent>
                </Card>

                {/* Existing Plans */}
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push(`/plans/${plan.id}`)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <Badge variant="outline" className="mb-2">
                                        {plan.type === 'custom' ? plan.custom_type : plan.type}
                                    </Badge>
                                    <CardTitle className="text-xl font-bold line-clamp-2">
                                        {plan.title}
                                    </CardTitle>
                                </div>
                                <Badge className={getPriorityColor(plan.priority)}>
                                    {plan.priority}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {plan.description}
                            </p>
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
                                        {plan.duration_type === 'deadline' ? (
                                            <Calendar className="h-4 w-4" />
                                        ) : (
                                            <Clock className="h-4 w-4" />
                                        )}
                                        <span>{formatDuration(plan)}</span>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        <strong>Goals: </strong>
                                        <span className="line-clamp-2">
                                            {plan.goals.join(', ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between items-center">
                            <Badge variant="outline">{plan.status}</Badge>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}