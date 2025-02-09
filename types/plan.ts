export type Plan = {
    id: string
    user_id: string
    goals: string[]
    deadline: string | null
    priority: 'low' | 'medium' | 'high'
    status: 'active' | 'completed' | 'paused'
    progress: number
    created_at: string
    updated_at: string
    thread_id: string | null
    duration_type: 'quantity' | 'deadline'
    duration_unit: 'days' | 'weeks' | 'months'
    duration_value: number
    title: string
    description: string
    type: string
    custom_type: string
}