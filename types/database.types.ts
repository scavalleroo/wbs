export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          cover: string | null
          created_at: string
          description: string | null
          id: number
          title: string | null
          url: string | null
        }
        Insert: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: number
          title?: string | null
          url?: string | null
        }
        Update: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: number
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      blocked_site_attempts: {
        Row: {
          blocked_site_id: number
          bypassed: boolean
          created_at: string
          domain: string
          duration_seconds: number | null
          id: number
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          blocked_site_id: number
          bypassed?: boolean
          created_at?: string
          domain: string
          duration_seconds?: number | null
          id?: number
          session_end?: string | null
          session_start?: string
          user_id: string
        }
        Update: {
          blocked_site_id?: number
          bypassed?: boolean
          created_at?: string
          domain?: string
          duration_seconds?: number | null
          id?: number
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_site_attempts_blocked_site_id_fkey"
            columns: ["blocked_site_id"]
            isOneToOne: false
            referencedRelation: "blocked_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_sites: {
        Row: {
          created_at: string
          domain: string
          friday_enabled: boolean
          friday_time_limit_minutes: number
          id: number
          last_streak_date: string | null
          max_daily_visits: number
          monday_enabled: boolean
          monday_time_limit_minutes: number
          saturday_enabled: boolean
          saturday_time_limit_minutes: number
          streak_count: number
          sunday_enabled: boolean
          sunday_time_limit_minutes: number
          thursday_enabled: boolean
          thursday_time_limit_minutes: number
          tuesday_enabled: boolean
          tuesday_time_limit_minutes: number
          user_id: string
          wednesday_enabled: boolean
          wednesday_time_limit_minutes: number
        }
        Insert: {
          created_at?: string
          domain: string
          friday_enabled?: boolean
          friday_time_limit_minutes?: number
          id?: number
          last_streak_date?: string | null
          max_daily_visits?: number
          monday_enabled?: boolean
          monday_time_limit_minutes?: number
          saturday_enabled?: boolean
          saturday_time_limit_minutes?: number
          streak_count?: number
          sunday_enabled?: boolean
          sunday_time_limit_minutes?: number
          thursday_enabled?: boolean
          thursday_time_limit_minutes?: number
          tuesday_enabled?: boolean
          tuesday_time_limit_minutes?: number
          user_id: string
          wednesday_enabled?: boolean
          wednesday_time_limit_minutes?: number
        }
        Update: {
          created_at?: string
          domain?: string
          friday_enabled?: boolean
          friday_time_limit_minutes?: number
          id?: number
          last_streak_date?: string | null
          max_daily_visits?: number
          monday_enabled?: boolean
          monday_time_limit_minutes?: number
          saturday_enabled?: boolean
          saturday_time_limit_minutes?: number
          streak_count?: number
          sunday_enabled?: boolean
          sunday_time_limit_minutes?: number
          thursday_enabled?: boolean
          thursday_time_limit_minutes?: number
          tuesday_enabled?: boolean
          tuesday_time_limit_minutes?: number
          user_id?: string
          wednesday_enabled?: boolean
          wednesday_time_limit_minutes?: number
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          activity: string
          actual_duration: number
          created_at: string
          duration: number
          ended_at: string | null
          flow_mode: boolean
          id: string
          sound: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          activity: string
          actual_duration: number
          created_at?: string
          duration: number
          ended_at?: string | null
          flow_mode?: boolean
          id?: string
          sound?: string | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          activity?: string
          actual_duration?: number
          created_at?: string
          duration?: number
          ended_at?: string | null
          flow_mode?: boolean
          id?: string
          sound?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_tracking: {
        Row: {
          created_at: string | null
          description: string | null
          exercise_rating: number | null
          id: string
          mood_rating: number | null
          nutrition_rating: number | null
          skipped: boolean | null
          sleep_rating: number | null
          social_rating: number | null
          tracked_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exercise_rating?: number | null
          id?: string
          mood_rating?: number | null
          nutrition_rating?: number | null
          skipped?: boolean | null
          sleep_rating?: number | null
          social_rating?: number | null
          tracked_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exercise_rating?: number | null
          id?: string
          mood_rating?: number | null
          nutrition_rating?: number | null
          skipped?: boolean | null
          sleep_rating?: number | null
          social_rating?: number | null
          tracked_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_notes: {
        Row: {
          content: Json | null
          created_at: string
          date: string
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          date: string
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          date?: string
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_projects_notes: {
        Row: {
          content: Json | null
          created_at: string
          id: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_focus_sessions: {
        Row: {
          active_users: number | null
          activity: string | null
          flow_mode: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      uuid_generate_v1: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v1mc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v3: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_generate_v4: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v5: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_nil: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_dns: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_oid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_x500: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
