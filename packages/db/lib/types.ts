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
      backlog_items: {
        Row: { completed_at: string | null; created_at: string; description: string | null; due_at: string | null; id: string; priority: string; sort_order: number; source: string; status: string; tags: string[]; tenant_id: string; title: string; updated_at: string }
        Insert: { completed_at?: string | null; created_at?: string; description?: string | null; due_at?: string | null; id?: string; priority?: string; sort_order?: number; source?: string; status?: string; tags?: string[]; tenant_id: string; title: string; updated_at?: string }
        Update: { completed_at?: string | null; created_at?: string; description?: string | null; due_at?: string | null; id?: string; priority?: string; sort_order?: number; source?: string; status?: string; tags?: string[]; tenant_id?: string; title?: string; updated_at?: string }
        Relationships: []
      }
      bookings: {
        Row: { client: string; created_at: string; date: string; id: string; package: string; revenue: number; status: string; tenant_id: string; time: string | null; updated_at: string }
        Insert: { client: string; created_at?: string; date: string; id?: string; package: string; revenue: number; status: string; tenant_id: string; time?: string | null; updated_at?: string }
        Update: { client?: string; created_at?: string; date?: string; id?: string; package?: string; revenue?: number; status?: string; tenant_id?: string; time?: string | null; updated_at?: string }
        Relationships: []
      }
      clips: {
        Row: { caption: string; created_at: string; end_seconds: number | null; episode_id: string; hook: string; id: string; platform: string; source: string; start_seconds: number | null; status: string; tenant_id: string; thumbnail_url: string | null; video_url: string | null; word_timestamps: Json | null }
        Insert: { caption: string; created_at?: string; end_seconds?: number | null; episode_id: string; hook: string; id?: string; platform: string; source?: string; start_seconds?: number | null; status?: string; tenant_id: string; thumbnail_url?: string | null; video_url?: string | null; word_timestamps?: Json | null }
        Update: { caption?: string; created_at?: string; end_seconds?: number | null; episode_id?: string; hook?: string; id?: string; platform?: string; source?: string; start_seconds?: number | null; status?: string; tenant_id?: string; thumbnail_url?: string | null; video_url?: string | null; word_timestamps?: Json | null }
        Relationships: []
      }
      content_submissions: {
        Row: { asset_type: string; client_email: string; client_name: string; created_at: string; delivered_at: string | null; delivery_url: string | null; description: string | null; duration_seconds: number | null; edit_brief: string | null; editor_notes: string | null; episode_id: string | null; id: string; source_url: string | null; status: string; storage_path: string | null; submitted_at: string; tenant_id: string; title: string }
        Insert: { asset_type?: string; client_email: string; client_name: string; created_at?: string; delivered_at?: string | null; delivery_url?: string | null; description?: string | null; duration_seconds?: number | null; edit_brief?: string | null; editor_notes?: string | null; episode_id?: string | null; id?: string; source_url?: string | null; status?: string; storage_path?: string | null; submitted_at?: string; tenant_id: string; title: string }
        Update: { asset_type?: string; client_email?: string; client_name?: string; created_at?: string; delivered_at?: string | null; delivery_url?: string | null; description?: string | null; duration_seconds?: number | null; edit_brief?: string | null; editor_notes?: string | null; episode_id?: string | null; id?: string; source_url?: string | null; status?: string; storage_path?: string | null; submitted_at?: string; tenant_id?: string; title?: string }
        Relationships: []
      }
      contracts: {
        Row: { amount: number; booking_id: string | null; client_email: string; client_name: string; created_at: string; id: string; ip_address: string | null; package: string; scope: string; sent_at: string; signature_initials: string | null; signature_name: string | null; signature_typed: string | null; signed_at: string | null; status: string; tenant_id: string; terms: Json }
        Insert: { amount: number; booking_id?: string | null; client_email: string; client_name: string; created_at?: string; id?: string; ip_address?: string | null; package: string; scope: string; sent_at?: string; signature_initials?: string | null; signature_name?: string | null; signature_typed?: string | null; signed_at?: string | null; status?: string; tenant_id: string; terms?: Json }
        Update: { amount?: number; booking_id?: string | null; client_email?: string; client_name?: string; created_at?: string; id?: string; ip_address?: string | null; package?: string; scope?: string; sent_at?: string; signature_initials?: string | null; signature_name?: string | null; signature_typed?: string | null; signed_at?: string | null; status?: string; tenant_id?: string; terms?: Json }
        Relationships: []
      }
      episodes: {
        Row: { clips_cut: number; clips_posted: number; created_at: string; duration_seconds: number | null; guest: string; guest_title: string; id: string; platforms: string[]; processing_state: string; raw_video_url: string | null; record_date: string; show: string; status: string; tenant_id: string; title: string; transcript: Json | null; transcript_url: string | null; updated_at: string }
        Insert: { clips_cut?: number; clips_posted?: number; created_at?: string; duration_seconds?: number | null; guest: string; guest_title?: string; id?: string; platforms?: string[]; processing_state?: string; raw_video_url?: string | null; record_date: string; show: string; status: string; tenant_id: string; title: string; transcript?: Json | null; transcript_url?: string | null; updated_at?: string }
        Update: { clips_cut?: number; clips_posted?: number; created_at?: string; duration_seconds?: number | null; guest?: string; guest_title?: string; id?: string; platforms?: string[]; processing_state?: string; raw_video_url?: string | null; record_date?: string; show?: string; status?: string; tenant_id?: string; title?: string; transcript?: Json | null; transcript_url?: string | null; updated_at?: string }
        Relationships: []
      }
      render_jobs: {
        Row: { clip_id: string; completed_at: string | null; created_at: string; episode_id: string; error: string | null; ffmpeg_log: string | null; id: string; started_at: string | null; state: string; tenant_id: string }
        Insert: { clip_id: string; completed_at?: string | null; created_at?: string; episode_id: string; error?: string | null; ffmpeg_log?: string | null; id?: string; started_at?: string | null; state?: string; tenant_id: string }
        Update: { clip_id?: string; completed_at?: string | null; created_at?: string; episode_id?: string; error?: string | null; ffmpeg_log?: string | null; id?: string; started_at?: string | null; state?: string; tenant_id?: string }
        Relationships: []
      }
      invoices: {
        Row: { client_email: string; client_name: string; created_at: string; description: string; due_at: string | null; id: string; issued_at: string; line_items: Json; number: string; paid_at: string | null; payment_method: string | null; status: string; stripe_payment_intent: string | null; subtotal: number; tax: number; tenant_id: string; total: number }
        Insert: { client_email: string; client_name: string; created_at?: string; description: string; due_at?: string | null; id?: string; issued_at?: string; line_items?: Json; number: string; paid_at?: string | null; payment_method?: string | null; status?: string; stripe_payment_intent?: string | null; subtotal: number; tax?: number; tenant_id: string; total: number }
        Update: { client_email?: string; client_name?: string; created_at?: string; description?: string; due_at?: string | null; id?: string; issued_at?: string; line_items?: Json; number?: string; paid_at?: string | null; payment_method?: string | null; status?: string; stripe_payment_intent?: string | null; subtotal?: number; tax?: number; tenant_id?: string; total?: number }
        Relationships: []
      }
      leads: {
        Row: { ai_angle: Json | null; created_at: string; days_in_stage: number; domain: string | null; enrichment_status: string; goal: string; id: string; name: string; primary_email: string | null; source: string; stage: string; tenant_id: string; type: string; updated_at: string; value: number }
        Insert: { ai_angle?: Json | null; created_at?: string; days_in_stage?: number; domain?: string | null; enrichment_status?: string; goal: string; id?: string; name: string; primary_email?: string | null; source: string; stage: string; tenant_id: string; type: string; updated_at?: string; value: number }
        Update: { ai_angle?: Json | null; created_at?: string; days_in_stage?: number; domain?: string | null; enrichment_status?: string; goal?: string; id?: string; name?: string; primary_email?: string | null; source?: string; stage?: string; tenant_id?: string; type?: string; updated_at?: string; value?: number }
        Relationships: []
      }
      lead_emails: {
        Row: { created_at: string; email: string; id: string; lead_id: string; primary_address: boolean; tenant_id: string }
        Insert: { created_at?: string; email: string; id?: string; lead_id: string; primary_address?: boolean; tenant_id: string }
        Update: { created_at?: string; email?: string; id?: string; lead_id?: string; primary_address?: boolean; tenant_id?: string }
        Relationships: []
      }
      lead_enrichment: {
        Row: { fetched_at: string; id: string; lead_id: string; raw: Json; source: string; tenant_id: string }
        Insert: { fetched_at?: string; id?: string; lead_id: string; raw?: Json; source: string; tenant_id: string }
        Update: { fetched_at?: string; id?: string; lead_id?: string; raw?: Json; source?: string; tenant_id?: string }
        Relationships: []
      }
      outreach_sequences: {
        Row: { completed_at: string | null; config: Json; created_at: string; emails: Json; external_id: string | null; id: string; lead_id: string; pushed_at: string | null; state: string; tenant_id: string; updated_at: string; vendor: string }
        Insert: { completed_at?: string | null; config?: Json; created_at?: string; emails?: Json; external_id?: string | null; id?: string; lead_id: string; pushed_at?: string | null; state?: string; tenant_id: string; updated_at?: string; vendor: string }
        Update: { completed_at?: string | null; config?: Json; created_at?: string; emails?: Json; external_id?: string | null; id?: string; lead_id?: string; pushed_at?: string | null; state?: string; tenant_id?: string; updated_at?: string; vendor?: string }
        Relationships: []
      }
      email_sends: {
        Row: { bounced_at: string | null; clicked_at: string | null; created_at: string; external_id: string | null; id: string; lead_email: string; lead_id: string; opened_at: string | null; replied_at: string | null; reply_body: string | null; scheduled_for: string | null; sent_at: string | null; sequence_id: string; step: number; tenant_id: string; vendor_status: string | null }
        Insert: { bounced_at?: string | null; clicked_at?: string | null; created_at?: string; external_id?: string | null; id?: string; lead_email: string; lead_id: string; opened_at?: string | null; replied_at?: string | null; reply_body?: string | null; scheduled_for?: string | null; sent_at?: string | null; sequence_id: string; step: number; tenant_id: string; vendor_status?: string | null }
        Update: { bounced_at?: string | null; clicked_at?: string | null; created_at?: string; external_id?: string | null; id?: string; lead_email?: string; lead_id?: string; opened_at?: string | null; replied_at?: string | null; reply_body?: string | null; scheduled_for?: string | null; sent_at?: string | null; sequence_id?: string; step?: number; tenant_id?: string; vendor_status?: string | null }
        Relationships: []
      }
      mrr: {
        Row: { content_agency: number; id: string; merch: number; naples_digital_commission: number; show_sponsors: number; studio_rental: number; tenant_id: string; updated_at: string }
        Insert: { content_agency: number; id?: string; merch: number; naples_digital_commission: number; show_sponsors: number; studio_rental: number; tenant_id: string; updated_at?: string }
        Update: { content_agency?: number; id?: string; merch?: number; naples_digital_commission?: number; show_sponsors?: number; studio_rental?: number; tenant_id?: string; updated_at?: string }
        Relationships: []
      }
      outreach_runs: {
        Row: { business_name: string; business_type: string; created_at: string; emails: Json; goal: string; id: string; source: string; tenant_id: string }
        Insert: { business_name: string; business_type: string; created_at?: string; emails: Json; goal: string; id?: string; source: string; tenant_id: string }
        Update: { business_name?: string; business_type?: string; created_at?: string; emails?: Json; goal?: string; id?: string; source?: string; tenant_id?: string }
        Relationships: []
      }
      outreach_stats: {
        Row: { emails_sent_this_week: number; id: string; meetings_booked: number; opens: number; replies: number; tenant_id: string; updated_at: string }
        Insert: { emails_sent_this_week: number; id?: string; meetings_booked: number; opens: number; replies: number; tenant_id: string; updated_at?: string }
        Update: { emails_sent_this_week?: number; id?: string; meetings_booked?: number; opens?: number; replies?: number; tenant_id?: string; updated_at?: string }
        Relationships: []
      }
      projections: {
        Row: { conservative: number; created_at: string; id: string; month: string; realistic: number; sort_order: number; tenant_id: string; upside: number }
        Insert: { conservative: number; created_at?: string; id?: string; month: string; realistic: number; sort_order: number; tenant_id: string; upside: number }
        Update: { conservative?: number; created_at?: string; id?: string; month?: string; realistic?: number; sort_order?: number; tenant_id?: string; upside?: number }
        Relationships: []
      }
      roadmap_phases: {
        Row: { created_at: string; id: string; items: Json; label: string; phase_number: number; tenant_id: string; updated_at: string }
        Insert: { created_at?: string; id?: string; items: Json; label: string; phase_number: number; tenant_id: string; updated_at?: string }
        Update: { created_at?: string; id?: string; items?: Json; label?: string; phase_number?: number; tenant_id?: string; updated_at?: string }
        Relationships: []
      }
      social_growth: {
        Row: { created_at: string; facebook: number; id: string; instagram: number; tenant_id: string; tiktok: number; week: string; youtube: number }
        Insert: { created_at?: string; facebook: number; id?: string; instagram: number; tenant_id: string; tiktok: number; week: string; youtube: number }
        Update: { created_at?: string; facebook?: number; id?: string; instagram?: number; tenant_id?: string; tiktok?: number; week?: string; youtube?: number }
        Relationships: []
      }
      sponsor_metrics: {
        Row: { clip_plays: number; created_at: string; id: string; impressions: number; mentions: number; sponsor_id: string; tenant_id: string; week: string }
        Insert: { clip_plays?: number; created_at?: string; id?: string; impressions?: number; mentions?: number; sponsor_id: string; tenant_id: string; week: string }
        Update: { clip_plays?: number; created_at?: string; id?: string; impressions?: number; mentions?: number; sponsor_id?: string; tenant_id?: string; week?: string }
        Relationships: []
      }
      sponsor_pitches: {
        Row: { audience_match: string; created_at: string; id: string; integration_ideas: Json; package_recommendation: Json; show: string; source: string; sponsor_name: string; tenant_id: string }
        Insert: { audience_match: string; created_at?: string; id?: string; integration_ideas: Json; package_recommendation: Json; show: string; source: string; sponsor_name: string; tenant_id: string }
        Update: { audience_match?: string; created_at?: string; id?: string; integration_ideas?: Json; package_recommendation?: Json; show?: string; source?: string; sponsor_name?: string; tenant_id?: string }
        Relationships: []
      }
      sponsors: {
        Row: { created_at: string; id: string; magic_link_token: string; name: string; tenant_id: string }
        Insert: { created_at?: string; id?: string; magic_link_token?: string; name: string; tenant_id: string }
        Update: { created_at?: string; id?: string; magic_link_token?: string; name?: string; tenant_id?: string }
        Relationships: []
      }
      tenants: {
        Row: { brand: Json; created_at: string; id: string; name: string; plan: string; slug: string; status: string; updated_at: string }
        Insert: { brand?: Json; created_at?: string; id?: string; name: string; plan?: string; slug: string; status?: string; updated_at?: string }
        Update: { brand?: Json; created_at?: string; id?: string; name?: string; plan?: string; slug?: string; status?: string; updated_at?: string }
        Relationships: []
      }
      tenant_users: {
        Row: { created_at: string; id: string; role: string; tenant_id: string; user_email: string }
        Insert: { created_at?: string; id?: string; role?: string; tenant_id: string; user_email: string }
        Update: { created_at?: string; id?: string; role?: string; tenant_id?: string; user_email?: string }
        Relationships: []
      }
      tenant_integrations: {
        Row: { config: Json; created_at: string; id: string; kind: string; last_verified_at: string | null; secret_ref: string | null; status: string; tenant_id: string; updated_at: string }
        Insert: { config?: Json; created_at?: string; id?: string; kind: string; last_verified_at?: string | null; secret_ref?: string | null; status?: string; tenant_id: string; updated_at?: string }
        Update: { config?: Json; created_at?: string; id?: string; kind?: string; last_verified_at?: string | null; secret_ref?: string | null; status?: string; tenant_id?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { set_current_tenant: { Args: { tenant_id: string }; Returns: undefined } }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
