"use client";

import { useSupabase } from "@/app/supabase-provider";
import { Plan } from "@/types/plan";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


export default function PlansDisplay() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const { supabase, session } = useSupabase();
    const router = useRouter();

    // Fetch plans on component mount
    useEffect(() => {
        const fetchPlans = async () => {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching plans:', error);
                return;
            }

            setPlans(data || []);
        };

        fetchPlans();
    }, [session, supabase]);

    // Function to get color based on priority
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

    // Function to format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <CardTitle className="text-xl font-bold line-clamp-2">{plan.goal}</CardTitle>
                                <Badge className={getPriorityColor(plan.priority)}>
                                    {plan.priority}
                                </Badge>
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

                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Deadline</span>
                                    <span>{formatDate(plan.deadline)}</span>
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