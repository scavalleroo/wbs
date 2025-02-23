import { createClient } from '@/utils/supabase/client';
import { Plan, PlanActivity } from '@/types/plan';


interface DailyTask {
    [key: string]: string;
}

interface Metric {
    type: string;
    value: string;
}

interface WeekData {
    description: string;
    status: string;
    daily_tasks: DailyTask;
    metric: Metric;
}

interface Tasks {
    [key: string]: WeekData;
}

export const PlanService = {
    async getPlanById(planId: string): Promise<Plan | null> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('plans')
            .select(`*`)
            .eq('id', planId)
            .single();

        if (error) {
            console.error('Error fetching plan:', error);
            throw error;
        }

        return data as Plan;
    },

    async deletePlan(planId: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', planId);

        if (error) {
            console.error('Error deleting plan:', error);
            throw error;
        }
    },

    async insertPlanActivities(planId: number, plan: any) {
        const supabase = createClient();
        const activities: any[] = [];
        const currentYear = new Date().getFullYear();

        // Loop through each week in tasks
        Object.entries(plan.tasks as Tasks).forEach(([weekKey, weekData]: [string, WeekData]) => {
            Object.entries(weekData.daily_tasks).forEach(([timeSlot, activity]: [string, string]) => {

                // Updated regex pattern to match "Friday (24/11), (15:30, 375 minutes)"
                const match = timeSlot.match(/^([^(]+)\s*\((\d{2})\/(\d{2})\),\s*\((\d{2}):(\d{2}),\s*(\d+)\s*minutes\)$/);

                if (match) {
                    const [, dayName, day, month, hour, minute, duration] = match;
                    console.log('Match:', dayName, day, month, hour, minute, duration);

                    const scheduledTimestamp = new Date(
                        currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)
                    );

                    activities.push({
                        plan_id: planId,
                        scheduled_timestamp: scheduledTimestamp,
                        description: activity,
                        duration: parseInt(duration),
                        status: 'To do'
                    });
                } else {
                    console.error('Invalid timeSlot format:', timeSlot);
                }
            });
        });

        // Single batch insert
        try {
            const { data, error } = await supabase
                .from('plan_activities')
                .insert(activities)
                .select();

            if (error) {
                console.error('Error inserting activities:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in database operation:', error);
            throw error;
        }
    },

    async fetchMonthActivities(currentDate: Date): Promise<PlanActivity[] | null> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('No user found');

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Query to get all activities for the current month
        const { data: activities, error } = await supabase
            .from('plan_activities')
            .select(`
            *,
            plan:plans(*)
          `)
            .gte('scheduled_timestamp', firstDayOfMonth.toISOString())
            .lte('scheduled_timestamp', lastDayOfMonth.toISOString())
            .eq('plan.user_id', user.id);

        if (error) {
            throw new Error(`Error fetching events: ${error.message}`);
        }

        return activities || [];
    },

    async updateActivity(updatedActivity: PlanActivity) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('plan_activities')
            .update({
                updated_at: new Date(),
                scheduled_timestamp: updatedActivity.scheduled_timestamp,
                description: updatedActivity.description,
                duration: updatedActivity.duration,
                status: updatedActivity.status
            })
            .eq('id', updatedActivity.id)
            .single();

        if (error) {
            console.error('Error updating activity:', error);
            throw error;
        }

        return data;
    }
};