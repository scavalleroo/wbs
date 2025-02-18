import { createClient } from '@/utils/supabase/client';
import { Plan } from '@/types/plan';
import { parseDateFromString, parseWeekDates } from '@/utils/helpers';

export const PlanService = {
    async getPlanById(planId: string): Promise<Plan | null> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('plans')
            .select(`
        *,
        goals,
        deadline,
        status,
        progress,
        thread_id,
        title,
        user_resources
      `)
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

    async insertPlanActivities(planId: number, activities: any) {
        const supabase = createClient();

        for (const [periodKey, periodData] of Object.entries(activities.plan.tasks) as [string, any][]) {
            // Try to match both week and day formats
            const weekMatch = periodKey.match(/Week (\d+)/);
            const dayMatch = periodKey.match(/Day (\d+) \((.*?)\)/);

            if (!weekMatch && !dayMatch) {
                throw new Error(`Invalid period format: ${periodKey}`);
            }

            const isWeekly = !!weekMatch;
            let startDate: Date, endDate: Date, periodNumber: number;

            if (isWeekly) {
                // Handle weekly plan
                periodNumber = parseInt(weekMatch[1]);
                const weekDates = parseWeekDates(periodKey);
                startDate = weekDates.startDate;
                endDate = weekDates.endDate;

                // Insert week record
                const { data: periodRecord, error: periodError } = await supabase
                    .from('plan_weeks')
                    .insert({
                        plan_id: planId,
                        week_number: periodNumber,
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        description: periodData.description,
                        status: periodData.status,
                        metric_type: periodData.metric.type,
                        metric_target: periodData.metric.value
                    })
                    .select()
                    .single();

                if (periodError) {
                    console.error('Error inserting week:', periodError);
                    continue;
                }

                // Process daily tasks for weekly plan
                const dailyTasks = Object.entries(periodData.daily_tasks).map(
                    ([dayKey, description]) => ({
                        plan_id: planId,
                        week_id: periodRecord.id,
                        scheduled_date: parseDateFromString(dayKey).toISOString(),
                        task_description: description,
                        status: 'Not Started'
                    })
                );

                // Insert daily tasks for weekly plan
                const { error: tasksError } = await supabase
                    .from('plan_activities')
                    .insert(dailyTasks);

                if (tasksError) {
                    console.error('Error inserting daily tasks:', tasksError);
                }
            } else {
                // Handle daily plan
                if (!dayMatch) {
                    throw new Error(`Invalid day format: ${periodKey}`);
                }
                periodNumber = parseInt(dayMatch[1]);
                const dayDate = new Date(dayMatch[2]);
                startDate = dayDate;
                endDate = dayDate;

                // Insert day record
                const { data: periodRecord, error: periodError } = await supabase
                    .from('plan_days')  // Assuming you have a plan_days table
                    .insert({
                        plan_id: planId,
                        day_number: periodNumber,
                        scheduled_date: dayDate.toISOString(),
                        description: periodData.description,
                        status: periodData.status,
                        metric_type: periodData.metric?.type,
                        metric_target: periodData.metric?.value
                    })
                    .select()
                    .single();

                if (periodError) {
                    console.error('Error inserting day:', periodError);
                    continue;
                }

                // For daily plans, insert the tasks directly
                const dailyTasks = {
                    plan_id: planId,
                    day_id: periodRecord.id,
                    scheduled_date: dayDate.toISOString(),
                    task_description: periodData.tasks || periodData.description,
                    status: 'Not Started'
                };

                // Insert daily task
                const { error: taskError } = await supabase
                    .from('plan_activities')
                    .insert(dailyTasks);

                if (taskError) {
                    console.error('Error inserting daily task:', taskError);
                }
            }
        }
    },

    async fetchMonthActivities(currentDate: Date) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const startOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
        const endOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

        try {
            // First fetch weekly activities
            const { data: weekly_activities, error: weeklyError } = await supabase
                .from('plan_activities')
                .select(`
                    *,
                    plan_weeks(
                        week_number,
                        start_date,
                        end_date,
                        plans(
                            title,
                            user_id
                        )
                    )
                `)
                .gte('scheduled_date', startOfMonth)
                .lte('scheduled_date', endOfMonth)
                .not('week_id', 'is', null)
                .eq('plan_weeks.plans.user_id', user.id);

            if (weeklyError) throw weeklyError;

            // Then fetch daily activities
            const { data: daily_activities, error: dailyError } = await supabase
                .from('plan_activities')
                .select(`
                    *,
                    plan_days(
                        day_number,
                        scheduled_date,
                        plans(
                            title,
                            user_id
                        )
                    )
                `)
                .gte('scheduled_date', startOfMonth)
                .lte('scheduled_date', endOfMonth)
                .not('day_id', 'is', null)
                .eq('plan_days.plans.user_id', user.id);

            if (dailyError) throw dailyError;

            // Combine and normalize the activities
            const normalized_activities = [
                ...(weekly_activities || []).map(activity => ({
                    ...activity,
                    plan_type: 'weekly',
                    plan_title: activity.plan_weeks?.plans?.title,
                    period_number: activity.plan_weeks?.week_number,
                    period_start: activity.plan_weeks?.start_date,
                    period_end: activity.plan_weeks?.end_date
                })),
                ...(daily_activities || []).map(activity => ({
                    ...activity,
                    plan_type: 'daily',
                    plan_title: activity.plan_days?.plans?.title,
                    period_number: activity.plan_days?.day_number,
                    period_start: activity.plan_days?.scheduled_date,
                    period_end: activity.plan_days?.scheduled_date
                }))
            ];

            console.log('normalized_activities', normalized_activities);

            return {
                plan_activities: normalized_activities,
                error: null
            };
        } catch (error) {
            console.error('Error fetching activities:', error);
            return {
                plan_activities: [],
                error
            };
        }
    }
};