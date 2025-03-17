export interface BlockedSite {
    id: number;
    created_at: string;
    user_id: string;
    domain: string;
    max_daily_visits: number;
    streak_count: number;
    last_streak_date: string | null;
}
  
export interface BlockedSiteAttempt {
    id: number;
    created_at: string;
    user_id: string;
    domain: string;
    blocked_site_id: number;
    bypassed: boolean;
}

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