import NewPlanChat from '@/components/ai-assistant/NewPlanChat'
import PlanCreationWizard from '@/components/ai-assistant/PlanCreationWizard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewPlanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <PlanCreationWizard />
    )
}