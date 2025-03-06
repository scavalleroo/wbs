import { Json } from "@/types/database.types";

export interface ProjectNote {
  id: number;
  title: string;
  content: Json | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
}

export interface DailyNote {
  id: number;
  date: string;
  content: Json | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
}

export type TypeNoteTab = "daily" | "project";