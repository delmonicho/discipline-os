// Hand-authored to mirror supabase/migrations/001_discipline_os.sql (+ 002).
// Swap for `supabase gen types typescript --local > src/database.types.ts` once the local
// stack is available — keep this shape so the typed client keeps working.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Ts = string;   // timestamptz, ISO string
type D = string;    // date, YYYY-MM-DD

export type Database = {
  public: {
    Tables: {
      identities: {
        Row: { id: string; user_id: string; label: string; description: string | null; created_at: Ts };
        Insert: { id?: string; user_id: string; label: string; description?: string | null; created_at?: Ts };
        Update: { id?: string; user_id?: string; label?: string; description?: string | null; created_at?: Ts };
        Relationships: [];
      };
      goals: {
        Row: { id: string; user_id: string; identity_id: string | null; title: string; outcome: string | null; target_date: D | null; status: string; created_at: Ts };
        Insert: { id?: string; user_id: string; identity_id?: string | null; title: string; outcome?: string | null; target_date?: D | null; status?: string; created_at?: Ts };
        Update: { id?: string; user_id?: string; identity_id?: string | null; title?: string; outcome?: string | null; target_date?: D | null; status?: string; created_at?: Ts };
        Relationships: [];
      };
      habits: {
        Row: { id: string; user_id: string; goal_id: string | null; name: string; tiny_version: string; cadence: Json; status: string; activation_order: number | null; activated_at: Ts | null; auto_source: Json | null; created_at: Ts };
        Insert: { id?: string; user_id: string; goal_id?: string | null; name: string; tiny_version: string; cadence?: Json; status?: string; activation_order?: number | null; activated_at?: Ts | null; auto_source?: Json | null; created_at?: Ts };
        Update: { id?: string; user_id?: string; goal_id?: string | null; name?: string; tiny_version?: string; cadence?: Json; status?: string; activation_order?: number | null; activated_at?: Ts | null; auto_source?: Json | null; created_at?: Ts };
        Relationships: [];
      };
      implementation_intentions: {
        Row: { id: string; user_id: string; habit_id: string; anchor: string; behavior: string; context: string | null; created_at: Ts };
        Insert: { id?: string; user_id: string; habit_id: string; anchor: string; behavior: string; context?: string | null; created_at?: Ts };
        Update: { id?: string; user_id?: string; habit_id?: string; anchor?: string; behavior?: string; context?: string | null; created_at?: Ts };
        Relationships: [];
      };
      habit_logs: {
        Row: { id: string; user_id: string; habit_id: string; log_date: D; status: string; source: string; note: string | null; practice_note: string | null; metadata: Json; created_at: Ts };
        Insert: { id?: string; user_id: string; habit_id: string; log_date?: D; status: string; source?: string; note?: string | null; practice_note?: string | null; metadata?: Json; created_at?: Ts };
        Update: { id?: string; user_id?: string; habit_id?: string; log_date?: D; status?: string; source?: string; note?: string | null; practice_note?: string | null; metadata?: Json; created_at?: Ts };
        Relationships: [];
      };
      reflections: {
        Row: { id: string; user_id: string; reflection_date: D; content: string; created_at: Ts };
        Insert: { id?: string; user_id: string; reflection_date?: D; content: string; created_at?: Ts };
        Update: { id?: string; user_id?: string; reflection_date?: D; content?: string; created_at?: Ts };
        Relationships: [];
      };
      coach_memory: {
        Row: { id: string; user_id: string; kind: string; content: string; created_at: Ts; last_referenced_at: Ts | null };
        Insert: { id?: string; user_id: string; kind: string; content: string; created_at?: Ts; last_referenced_at?: Ts | null };
        Update: { id?: string; user_id?: string; kind?: string; content?: string; created_at?: Ts; last_referenced_at?: Ts | null };
        Relationships: [];
      };
      weekly_reviews: {
        Row: { id: string; user_id: string; week_start: D; week_end: D; summary: string; wins: string | null; struggles: string | null; adaptations: string | null; created_at: Ts };
        Insert: { id?: string; user_id: string; week_start: D; week_end: D; summary: string; wins?: string | null; struggles?: string | null; adaptations?: string | null; created_at?: Ts };
        Update: { id?: string; user_id?: string; week_start?: D; week_end?: D; summary?: string; wins?: string | null; struggles?: string | null; adaptations?: string | null; created_at?: Ts };
        Relationships: [];
      };
      plan_proposals: {
        Row: { id: string; user_id: string; change_type: string; details: string; rationale: string | null; status: string; created_at: Ts; resolved_at: Ts | null };
        Insert: { id?: string; user_id: string; change_type: string; details: string; rationale?: string | null; status?: string; created_at?: Ts; resolved_at?: Ts | null };
        Update: { id?: string; user_id?: string; change_type?: string; details?: string; rationale?: string | null; status?: string; created_at?: Ts; resolved_at?: Ts | null };
        Relationships: [];
      };
      coach_messages: {
        Row: { id: string; user_id: string; role: string; content: string; created_at: Ts };
        Insert: { id?: string; user_id: string; role: string; content: string; created_at?: Ts };
        Update: { id?: string; user_id?: string; role?: string; content?: string; created_at?: Ts };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
