export type Mood = {
    id: string;
    user_id: string;
    mood_rating: number | null;
    description: string | null;
    skipped: boolean;
    created_at: string;
};