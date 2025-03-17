export interface Mood {
  id: string;
  user_id: string;
  mood_rating: number | null;
  sleep_rating: number | null;
  nutrition_rating: number | null;
  exercise_rating: number | null;
  social_rating: number | null;
  description: string | null;
  skipped: boolean;
  created_at: string;
  updated_at: string;
  tracked_date: string; // New field representing the date the mood data refers to
}

// Keep the WellnessRatings interface the same
export interface WellnessRatings {
  mood_rating: number | null;
  sleep_rating: number | null;
  nutrition_rating: number | null;
  exercise_rating: number | null;
  social_rating: number | null;
}