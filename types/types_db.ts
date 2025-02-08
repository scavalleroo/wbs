export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        tables: {
            plans: {
                Row: {
                    id: string
                    user_id: string
                    goal: string
                    deadline: string | null
                    priority: 'low' | 'medium' | 'high'
                    status: 'active' | 'completed' | 'paused'
                    progress: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    goal: string
                    deadline?: string
                    priority?: 'low' | 'medium' | 'high'
                    status?: 'active' | 'completed' | 'paused'
                    progress?: number
                }
                Update: {
                    goal?: string
                    deadline?: string
                    priority?: 'low' | 'medium' | 'high'
                    status?: 'active' | 'completed' | 'paused'
                    progress?: number
                }
            }
            tasks: {
                Row: {
                    id: string
                    plan_id: string
                    title: string
                    description: string | null
                    scheduled_date: string | null
                    completed_date: string | null
                    status: 'pending' | 'completed' | 'delayed'
                    order_index: number
                    created_at: string
                }
                Insert: {
                    plan_id: string
                    title: string
                    description?: string
                    scheduled_date?: string
                    status?: 'pending' | 'completed' | 'delayed'
                    order_index?: number
                }
                Update: {
                    title?: string
                    description?: string
                    scheduled_date?: string
                    completed_date?: string
                    status?: 'pending' | 'completed' | 'delayed'
                    order_index?: number
                }
            }
            prices: {
                Row: {
                    active: boolean | null;
                    currency: string | null;
                    description: string | null;
                    id: string;
                    // interval: Database['public']['Enums']['pricing_plan_interval'] | null;
                    interval_count: number | null;
                    metadata: Json | null;
                    product_id: string | null;
                    trial_period_days: number | null;
                    // type: Database['public']['Enums']['pricing_type'] | null;
                    unit_amount: number | null;
                };
                Insert: {
                    active?: boolean | null;
                    currency?: string | null;
                    description?: string | null;
                    id: string;
                    interval?:
                    // | Database['public']['Enums']['pricing_plan_interval']
                    | null;
                    interval_count?: number | null;
                    metadata?: Json | null;
                    product_id?: string | null;
                    trial_period_days?: number | null;
                    // type?: Database['public']['Enums']['pricing_type'] | null;
                    unit_amount?: number | null;
                };
                Update: {
                    active?: boolean | null;
                    currency?: string | null;
                    description?: string | null;
                    id?: string;
                    interval?:
                    // | Database['public']['Enums']['pricing_plan_interval']
                    | null;
                    interval_count?: number | null;
                    metadata?: Json | null;
                    product_id?: string | null;
                    trial_period_days?: number | null;
                    // type?: Database['public']['Enums']['pricing_type'] | null;
                    unit_amount?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'prices_product_id_fkey';
                        columns: ['product_id'];
                        referencedRelation: 'products';
                        referencedColumns: ['id'];
                    }
                ];
            };
        }
    }
}
