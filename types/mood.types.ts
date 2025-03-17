export interface Mood {
    id: string;
    user_id: string;
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
    description: string | null;
    skipped: boolean | null;
    created_at: string;
  }
  
  export interface WellnessRatings {
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
  }