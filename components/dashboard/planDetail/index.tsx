/*eslint-disable*/
'use client';

import DashboardLayout from '@/components/layout';
import { Plan } from '@/types/plan';
import { User } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PlanDetailsContent from './plan-details-content';
import { PlanService } from './service';

interface Props {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export default function PlanPage(props: Props) {
    const params = useParams();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Replace this with your actual data fetching logic
        const fetchPlan = async () => {
            try {
                if (typeof params.id === 'string') {
                    const planData = await PlanService.getPlanById(params.id);
                    setPlan(planData);
                }
            } catch (error) {
                console.error("Error fetching plan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [params.id]);

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (!plan) {
        return <div className="p-4">Plan not found</div>;
    }

    return (
        <DashboardLayout
            user={props.user}
            userDetails={props.userDetails}
            title="Subscription Page"
            description="Manage your subscriptions"
        >
            <div className="h-full w-full">
                <div className="mb-5 flex gap-5 flex-col xl:flex-row w-full">
                    <PlanDetailsContent planData={plan} />
                </div>
            </div>
        </DashboardLayout>
    );
}
