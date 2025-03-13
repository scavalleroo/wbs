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
  
export interface UseBlockedSiteParams {
    user: { id: string } | null | undefined;
}