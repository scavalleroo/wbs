import { createClient } from '@/utils/supabase/client';
import { Plan, PlanActivity } from '@/types/plan';
import { parseDateFromString, parseWeekDates } from '@/utils/helpers';

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

    async insertPlanActivities(planId: number, activities: any) {
        const supabase = createClient();
        console.log(activities);
    },

    async fetchMonthActivities(currentDate: Date): Promise<PlanActivity[] | null> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const startOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
        const endOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

        return [];
    }
};