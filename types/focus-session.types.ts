export interface FocusSession {
    id: string;
    user_id: string;
    activity: string;
    sound: string;
    duration: number; // planned duration in seconds
    actual_duration: number; // actual time spent in seconds
    flow_mode: boolean;
    started_at: string;
    ended_at: string | null;
    status: 'active' | 'completed' | 'abandoned';
    created_at: string;
  }
  
  export interface FocusSessionCreate {
    user_id: string;
    activity: string;
    sound: string;
    duration: number;
    flow_mode: boolean;
  }
  
  export interface FocusSessionUpdate {
    sound?: string;
    activity?: string;
    actual_duration?: number;
    ended_at?: string;
    status?: 'active' | 'completed' | 'abandoned';
  }
  
  export interface FocusSessionStats {
    total_sessions: number;
    total_duration: number; // in seconds
    average_duration: number; // in seconds
    favorite_activity: string;
    streak_days: number;
  }
  
  export interface ActiveFocusSessions {
    active_users: number;
    activity: string;
    flow_mode: boolean;
  }