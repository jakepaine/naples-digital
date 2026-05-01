// Generated via Supabase MCP `generate_typescript_types` against project ylqoxefiwwimzxeuzfxy.
// Regenerate when schema changes: invoke mcp__claude_ai_Supabase__generate_typescript_types.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      bookings: {
        Row: { client: string; created_at: string; date: string; id: string; package: string; revenue: number; status: string; updated_at: string }
        Insert: { client: string; created_at?: string; date: string; id?: string; package: string; revenue: number; status: string; updated_at?: string }
        Update: { client?: string; created_at?: string; date?: string; id?: string; package?: string; revenue?: number; status?: string; updated_at?: string }
        Relationships: []
      }
      clips: {
        Row: { caption: string; created_at: string; episode_id: string; hook: string; id: string; platform: string; source: string; status: string }
        Insert: { caption: string; created_at?: string; episode_id: string; hook: string; id?: string; platform: string; source?: string; status?: string }
        Update: { caption?: string; created_at?: string; episode_id?: string; hook?: string; id?: string; platform?: string; source?: string; status?: string }
        Relationships: []
      }
      episodes: {
        Row: { clips_cut: number; clips_posted: number; created_at: string; guest: string; guest_title: string; id: string; platforms: string[]; record_date: string; show: string; status: string; title: string; updated_at: string }
        Insert: { clips_cut?: number; clips_posted?: number; created_at?: string; guest: string; guest_title?: string; id?: string; platforms?: string[]; record_date: string; show: string; status: string; title: string; updated_at?: string }
        Update: { clips_cut?: number; clips_posted?: number; created_at?: string; guest?: string; guest_title?: string; id?: string; platforms?: string[]; record_date?: string; show?: string; status?: string; title?: string; updated_at?: string }
        Relationships: []
      }
      leads: {
        Row: { ai_angle: Json | null; created_at: string; days_in_stage: number; goal: string; id: string; name: string; source: string; stage: string; type: string; updated_at: string; value: number }
        Insert: { ai_angle?: Json | null; created_at?: string; days_in_stage?: number; goal: string; id?: string; name: string; source: string; stage: string; type: string; updated_at?: string; value: number }
        Update: { ai_angle?: Json | null; created_at?: string; days_in_stage?: number; goal?: string; id?: string; name?: string; source?: string; stage?: string; type?: string; updated_at?: string; value?: number }
        Relationships: []
      }
      mrr: {
        Row: { content_agency: number; id: string; merch: number; naples_digital_commission: number; show_sponsors: number; studio_rental: number; updated_at: string }
        Insert: { content_agency: number; id?: string; merch: number; naples_digital_commission: number; show_sponsors: number; studio_rental: number; updated_at?: string }
        Update: { content_agency?: number; id?: string; merch?: number; naples_digital_commission?: number; show_sponsors?: number; studio_rental?: number; updated_at?: string }
        Relationships: []
      }
      outreach_runs: {
        Row: { business_name: string; business_type: string; created_at: string; emails: Json; goal: string; id: string; source: string }
        Insert: { business_name: string; business_type: string; created_at?: string; emails: Json; goal: string; id?: string; source: string }
        Update: { business_name?: string; business_type?: string; created_at?: string; emails?: Json; goal?: string; id?: string; source?: string }
        Relationships: []
      }
      outreach_stats: {
        Row: { emails_sent_this_week: number; id: string; meetings_booked: number; opens: number; replies: number; updated_at: string }
        Insert: { emails_sent_this_week: number; id?: string; meetings_booked: number; opens: number; replies: number; updated_at?: string }
        Update: { emails_sent_this_week?: number; id?: string; meetings_booked?: number; opens?: number; replies?: number; updated_at?: string }
        Relationships: []
      }
      projections: {
        Row: { conservative: number; created_at: string; id: string; month: string; realistic: number; sort_order: number; upside: number }
        Insert: { conservative: number; created_at?: string; id?: string; month: string; realistic: number; sort_order: number; upside: number }
        Update: { conservative?: number; created_at?: string; id?: string; month?: string; realistic?: number; sort_order?: number; upside?: number }
        Relationships: []
      }
      roadmap_phases: {
        Row: { created_at: string; id: string; items: Json; label: string; phase_number: number; updated_at: string }
        Insert: { created_at?: string; id?: string; items: Json; label: string; phase_number: number; updated_at?: string }
        Update: { created_at?: string; id?: string; items?: Json; label?: string; phase_number?: number; updated_at?: string }
        Relationships: []
      }
      social_growth: {
        Row: { created_at: string; facebook: number; id: string; instagram: number; tiktok: number; week: string; youtube: number }
        Insert: { created_at?: string; facebook: number; id?: string; instagram: number; tiktok: number; week: string; youtube: number }
        Update: { created_at?: string; facebook?: number; id?: string; instagram?: number; tiktok?: number; week?: string; youtube?: number }
        Relationships: []
      }
      sponsor_metrics: {
        Row: { clip_plays: number; created_at: string; id: string; impressions: number; mentions: number; sponsor_id: string; week: string }
        Insert: { clip_plays?: number; created_at?: string; id?: string; impressions?: number; mentions?: number; sponsor_id: string; week: string }
        Update: { clip_plays?: number; created_at?: string; id?: string; impressions?: number; mentions?: number; sponsor_id?: string; week?: string }
        Relationships: []
      }
      sponsor_pitches: {
        Row: { audience_match: string; created_at: string; id: string; integration_ideas: Json; package_recommendation: Json; show: string; source: string; sponsor_name: string }
        Insert: { audience_match: string; created_at?: string; id?: string; integration_ideas: Json; package_recommendation: Json; show: string; source: string; sponsor_name: string }
        Update: { audience_match?: string; created_at?: string; id?: string; integration_ideas?: Json; package_recommendation?: Json; show?: string; source?: string; sponsor_name?: string }
        Relationships: []
      }
      sponsors: {
        Row: { created_at: string; id: string; magic_link_token: string; name: string }
        Insert: { created_at?: string; id?: string; magic_link_token?: string; name: string }
        Update: { created_at?: string; id?: string; magic_link_token?: string; name?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
