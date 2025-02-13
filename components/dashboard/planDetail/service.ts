import { createClient } from '@/utils/supabase/client';
import { Plan } from '@/types/plan';

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
    }
};