export interface BlockedSite {
  id: number;
  created_at: string;
  user_id: string;
  domain: string;
  max_daily_visits: number;
  last_streak_date: string | null;
  streak_count: number;
  // Day-specific time limit fields
  monday_enabled: boolean;
  tuesday_enabled: boolean;
  wednesday_enabled: boolean;
  thursday_enabled: boolean;
  friday_enabled: boolean;
  saturday_enabled: boolean;
  sunday_enabled: boolean;
  monday_time_limit_minutes: number;
  tuesday_time_limit_minutes: number;
  wednesday_time_limit_minutes: number;
  thursday_time_limit_minutes: number;
  friday_time_limit_minutes: number;
  saturday_time_limit_minutes: number;
  sunday_time_limit_minutes: number;
  // Allow dynamic access using string indexing
  [key: string]: any;
}

export interface BlockedSiteAttempt {
  id: number;
  created_at: string;
  user_id: string;
  domain: string;
  blocked_site_id: number;
  bypassed: boolean;
  session_start: string;
  session_end: string | null;
  duration_seconds: number | null;
}

export interface DayTimeLimit {
  enabled: boolean;
  minutes: number;
}

export type WeekdayLimits = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: DayTimeLimit
}

export interface PopularSite {
  name: string;
  domain: string;
}

export const daysOfWeek = [
  { key: 'monday', label: 'M' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'W' },
  { key: 'thursday', label: 'T' },
  { key: 'friday', label: 'F' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'S' }
];

export interface AttemptDetail {
    domain: string;
    attempts: number;
    bypasses: number;
  }
  
  export interface DailyFocusData {
    date: string;
    formattedDate: string;
    focusScore: number;
    attempts: number;
    bypasses: number;
    attemptDetails: AttemptDetail[];
    isFutureDate: boolean;
    hasData: boolean;
  }