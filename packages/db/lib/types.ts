export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backlog_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          sort_order: number
          source: string
          status: string
          tags: string[]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          sort_order?: number
          source?: string
          status?: string
          tags?: string[]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          sort_order?: number
          source?: string
          status?: string
          tags?: string[]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client: string
          created_at: string
          date: string
          id: string
          package: string
          revenue: number
          status: string
          tenant_id: string
          time: string | null
          updated_at: string
        }
        Insert: {
          client: string
          created_at?: string
          date: string
          id?: string
          package: string
          revenue: number
          status: string
          tenant_id: string
          time?: string | null
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          date?: string
          id?: string
          package?: string
          revenue?: number
          status?: string
          tenant_id?: string
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_tasks: {
        Row: {
          assignee_email: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          invoice_id: string | null
          lead_id: string | null
          notes: string | null
          status: string
          task_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assignee_email?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          invoice_id?: string | null
          lead_id?: string | null
          notes?: string | null
          status?: string
          task_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assignee_email?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          invoice_id?: string | null
          lead_id?: string | null
          notes?: string | null
          status?: string
          task_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_tasks_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          caption: string
          created_at: string
          end_seconds: number | null
          episode_id: string
          hook: string
          id: string
          platform: string
          source: string
          start_seconds: number | null
          status: string
          tenant_id: string
          thumbnail_url: string | null
          video_url: string | null
          word_timestamps: Json | null
        }
        Insert: {
          caption: string
          created_at?: string
          end_seconds?: number | null
          episode_id: string
          hook: string
          id?: string
          platform: string
          source?: string
          start_seconds?: number | null
          status?: string
          tenant_id: string
          thumbnail_url?: string | null
          video_url?: string | null
          word_timestamps?: Json | null
        }
        Update: {
          caption?: string
          created_at?: string
          end_seconds?: number | null
          episode_id?: string
          hook?: string
          id?: string
          platform?: string
          source?: string
          start_seconds?: number | null
          status?: string
          tenant_id?: string
          thumbnail_url?: string | null
          video_url?: string | null
          word_timestamps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clips_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_email_replies: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          crm_from_stage: string | null
          crm_lead_id: string | null
          crm_stage_advanced: boolean
          crm_to_stage: string | null
          id: string
          intent: string
          intent_confidence: number | null
          intent_reason: string | null
          lead_email: string | null
          lead_name: string | null
          processed_at: string | null
          raw: Json
          received_at: string
          removed_from_campaign: boolean
          removed_from_campaign_at: string | null
          reply_body: string | null
          reply_subject: string | null
          sla_breach_alerted_at: string | null
          sla_responded_at: string | null
          sla_target_seconds: number
          slack_alerted: boolean
          source: string
          source_event_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          crm_from_stage?: string | null
          crm_lead_id?: string | null
          crm_stage_advanced?: boolean
          crm_to_stage?: string | null
          id?: string
          intent: string
          intent_confidence?: number | null
          intent_reason?: string | null
          lead_email?: string | null
          lead_name?: string | null
          processed_at?: string | null
          raw?: Json
          received_at?: string
          removed_from_campaign?: boolean
          removed_from_campaign_at?: string | null
          reply_body?: string | null
          reply_subject?: string | null
          sla_breach_alerted_at?: string | null
          sla_responded_at?: string | null
          sla_target_seconds?: number
          slack_alerted?: boolean
          source?: string
          source_event_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          crm_from_stage?: string | null
          crm_lead_id?: string | null
          crm_stage_advanced?: boolean
          crm_to_stage?: string | null
          id?: string
          intent?: string
          intent_confidence?: number | null
          intent_reason?: string | null
          lead_email?: string | null
          lead_name?: string | null
          processed_at?: string | null
          raw?: Json
          received_at?: string
          removed_from_campaign?: boolean
          removed_from_campaign_at?: string | null
          reply_body?: string | null
          reply_subject?: string | null
          sla_breach_alerted_at?: string | null
          sla_responded_at?: string | null
          sla_target_seconds?: number
          slack_alerted?: boolean
          source?: string
          source_event_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cold_email_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_ads: {
        Row: {
          ad_archive_id: string
          ad_text: string | null
          ai_summary: string | null
          asset_type: string | null
          brand_id: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          first_seen_at: string | null
          hook_tactic: string | null
          id: string
          image_url: string | null
          last_seen_at: string | null
          messaging_angle: string | null
          offer_type: string | null
          raw: Json
          tenant_id: string
          updated_at: string
          video_url: string | null
          visual_format: string | null
          weeks_in_top10: number
        }
        Insert: {
          ad_archive_id: string
          ad_text?: string | null
          ai_summary?: string | null
          asset_type?: string | null
          brand_id: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          first_seen_at?: string | null
          hook_tactic?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          messaging_angle?: string | null
          offer_type?: string | null
          raw?: Json
          tenant_id: string
          updated_at?: string
          video_url?: string | null
          visual_format?: string | null
          weeks_in_top10?: number
        }
        Update: {
          ad_archive_id?: string
          ad_text?: string | null
          ai_summary?: string | null
          asset_type?: string | null
          brand_id?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          first_seen_at?: string | null
          hook_tactic?: string | null
          id?: string
          image_url?: string | null
          last_seen_at?: string | null
          messaging_angle?: string | null
          offer_type?: string | null
          raw?: Json
          tenant_id?: string
          updated_at?: string
          video_url?: string | null
          visual_format?: string | null
          weeks_in_top10?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitor_ads_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "competitor_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_ads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_brands: {
        Row: {
          created_at: string
          enabled: boolean
          fb_page_id: string | null
          id: string
          last_synced_at: string | null
          name: string
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          fb_page_id?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          fb_page_id?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          metadata: Json
          source_url: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          source_url?: string | null
          status?: string
          tenant_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          source_url?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_submissions: {
        Row: {
          asset_type: string
          client_email: string
          client_name: string
          created_at: string
          delivered_at: string | null
          delivery_url: string | null
          description: string | null
          duration_seconds: number | null
          edit_brief: string | null
          editor_notes: string | null
          episode_id: string | null
          id: string
          source_url: string | null
          status: string
          storage_path: string | null
          submitted_at: string
          tenant_id: string
          title: string
        }
        Insert: {
          asset_type?: string
          client_email: string
          client_name: string
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          description?: string | null
          duration_seconds?: number | null
          edit_brief?: string | null
          editor_notes?: string | null
          episode_id?: string | null
          id?: string
          source_url?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string
          tenant_id: string
          title: string
        }
        Update: {
          asset_type?: string
          client_email?: string
          client_name?: string
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          description?: string | null
          duration_seconds?: number | null
          edit_brief?: string | null
          editor_notes?: string | null
          episode_id?: string | null
          id?: string
          source_url?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_submissions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_variants: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          hashtags: string[]
          id: string
          platform: string
          post_id: string
          published_at: string | null
          published_url: string | null
          scheduled_at: string | null
          status: string
          tenant_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          hashtags?: string[]
          id?: string
          platform: string
          post_id: string
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          hashtags?: string[]
          id?: string
          platform?: string
          post_id?: string
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          booking_id: string | null
          client_email: string
          client_name: string
          created_at: string
          id: string
          ip_address: string | null
          package: string
          scope: string
          sent_at: string
          signature_initials: string | null
          signature_name: string | null
          signature_typed: string | null
          signed_at: string | null
          status: string
          tenant_id: string
          terms: Json
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_email: string
          client_name: string
          created_at?: string
          id?: string
          ip_address?: string | null
          package: string
          scope: string
          sent_at?: string
          signature_initials?: string | null
          signature_name?: string | null
          signature_typed?: string | null
          signed_at?: string | null
          status?: string
          tenant_id: string
          terms?: Json
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_email?: string
          client_name?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          package?: string
          scope?: string
          sent_at?: string
          signature_initials?: string | null
          signature_name?: string | null
          signature_typed?: string | null
          signed_at?: string | null
          status?: string
          tenant_id?: string
          terms?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverability_alerts: {
        Row: {
          alert_kind: string
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          id: string
          message: string
          metric_name: string | null
          metric_value: number | null
          paused_at: string | null
          paused_campaign: boolean
          raw: Json
          resolved: boolean
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: string
          slack_alerted: boolean
          source: string
          tenant_id: string
          threshold: number | null
          updated_at: string
        }
        Insert: {
          alert_kind: string
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          id?: string
          message: string
          metric_name?: string | null
          metric_value?: number | null
          paused_at?: string | null
          paused_campaign?: boolean
          raw?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity: string
          slack_alerted?: boolean
          source: string
          tenant_id: string
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          alert_kind?: string
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          id?: string
          message?: string
          metric_name?: string | null
          metric_value?: number | null
          paused_at?: string | null
          paused_campaign?: boolean
          raw?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          slack_alerted?: boolean
          source?: string
          tenant_id?: string
          threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverability_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverability_audits: {
        Row: {
          created_at: string
          dkim_selectors_checked: string[] | null
          dkim_selectors_passing: string[] | null
          dmarc_pct: number | null
          dmarc_policy: string | null
          dmarc_present: boolean
          dmarc_record: string | null
          domain: string
          id: string
          list_unsubscribe_compliant: boolean
          mx_records: string[] | null
          notes: string | null
          risk_flags: string[] | null
          score: number | null
          spf_includes: string[] | null
          spf_present: boolean
          spf_record: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          dkim_selectors_checked?: string[] | null
          dkim_selectors_passing?: string[] | null
          dmarc_pct?: number | null
          dmarc_policy?: string | null
          dmarc_present?: boolean
          dmarc_record?: string | null
          domain: string
          id?: string
          list_unsubscribe_compliant?: boolean
          mx_records?: string[] | null
          notes?: string | null
          risk_flags?: string[] | null
          score?: number | null
          spf_includes?: string[] | null
          spf_present?: boolean
          spf_record?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          dkim_selectors_checked?: string[] | null
          dkim_selectors_passing?: string[] | null
          dmarc_pct?: number | null
          dmarc_policy?: string | null
          dmarc_present?: boolean
          dmarc_record?: string | null
          domain?: string
          id?: string
          list_unsubscribe_compliant?: boolean
          mx_records?: string[] | null
          notes?: string | null
          risk_flags?: string[] | null
          score?: number | null
          spf_includes?: string[] | null
          spf_present?: boolean
          spf_record?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverability_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_auto_reply_templates: {
        Row: {
          body_template: string
          category: string
          created_at: string
          enabled: boolean
          fire_count: number
          id: string
          last_fired_at: string | null
          name: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body_template: string
          category: string
          created_at?: string
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          category?: string
          created_at?: string
          enabled?: boolean
          fire_count?: number
          id?: string
          last_fired_at?: string | null
          name?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_auto_reply_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_classifications: {
        Row: {
          actor: string | null
          category: string
          created_at: string
          email_id: string
          id: string
          reason: string | null
          score: number | null
          source: string
          tenant_id: string
        }
        Insert: {
          actor?: string | null
          category: string
          created_at?: string
          email_id: string
          id?: string
          reason?: string | null
          score?: number | null
          source: string
          tenant_id: string
        }
        Update: {
          actor?: string | null
          category?: string
          created_at?: string
          email_id?: string
          id?: string
          reason?: string | null
          score?: number | null
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_classifications_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_classifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string
          external_id: string | null
          id: string
          lead_email: string
          lead_id: string
          opened_at: string | null
          replied_at: string | null
          reply_body: string | null
          scheduled_for: string | null
          sent_at: string | null
          sequence_id: string
          step: number
          tenant_id: string
          vendor_status: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lead_email: string
          lead_id: string
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_id: string
          step: number
          tenant_id: string
          vendor_status?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lead_email?: string
          lead_id?: string
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sequence_id?: string
          step?: number
          tenant_id?: string
          vendor_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          archived: boolean
          archived_at: string | null
          auto_replied: boolean
          auto_reply_text: string | null
          body_html: string | null
          body_text: string | null
          category: string | null
          classified_at: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          metadata: Json
          preview: string | null
          reason: string | null
          received_at: string
          score: number | null
          slack_notified: boolean
          source: string
          source_message_id: string | null
          source_thread_id: string | null
          subject: string
          tenant_id: string
          to_email: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          auto_replied?: boolean
          auto_reply_text?: string | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          classified_at?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          metadata?: Json
          preview?: string | null
          reason?: string | null
          received_at: string
          score?: number | null
          slack_notified?: boolean
          source?: string
          source_message_id?: string | null
          source_thread_id?: string | null
          subject?: string
          tenant_id: string
          to_email?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          auto_replied?: boolean
          auto_reply_text?: string | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          classified_at?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          metadata?: Json
          preview?: string | null
          reason?: string | null
          received_at?: string
          score?: number | null
          slack_notified?: boolean
          source?: string
          source_message_id?: string | null
          source_thread_id?: string | null
          subject?: string
          tenant_id?: string
          to_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_inputs: {
        Row: {
          company_name: string | null
          created_at: string
          domain: string | null
          email: string | null
          first_name: string | null
          icebreaker: string | null
          id: string
          job_id: string
          last_name: string | null
          linkedin_url: string | null
          notes: string | null
          resolved_at: string | null
          resolved_confidence: number | null
          resolved_email: string | null
          resolved_source: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          first_name?: string | null
          icebreaker?: string | null
          id?: string
          job_id: string
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolved_confidence?: number | null
          resolved_email?: string | null
          resolved_source?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          first_name?: string | null
          icebreaker?: string | null
          id?: string
          job_id?: string
          last_name?: string | null
          linkedin_url?: string | null
          notes?: string | null
          resolved_at?: string | null
          resolved_confidence?: number | null
          resolved_email?: string | null
          resolved_source?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_inputs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "enrichment_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrichment_inputs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_jobs: {
        Row: {
          completed_at: string | null
          confidence_threshold: number
          created_at: string
          created_by_user_id: string | null
          enriched_count: number
          error_summary: string | null
          failed_count: number
          id: string
          name: string
          pushed_at: string | null
          pushed_to_outreach: boolean
          source_priority: string[]
          started_at: string | null
          status: string
          tenant_id: string
          title_filter: string | null
          total_inputs: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          confidence_threshold?: number
          created_at?: string
          created_by_user_id?: string | null
          enriched_count?: number
          error_summary?: string | null
          failed_count?: number
          id?: string
          name: string
          pushed_at?: string | null
          pushed_to_outreach?: boolean
          source_priority?: string[]
          started_at?: string | null
          status?: string
          tenant_id: string
          title_filter?: string | null
          total_inputs?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          confidence_threshold?: number
          created_at?: string
          created_by_user_id?: string | null
          enriched_count?: number
          error_summary?: string | null
          failed_count?: number
          id?: string
          name?: string
          pushed_at?: string | null
          pushed_to_outreach?: boolean
          source_priority?: string[]
          started_at?: string | null
          status?: string
          tenant_id?: string
          title_filter?: string | null
          total_inputs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_results: {
        Row: {
          confidence: number | null
          created_at: string
          duration_ms: number | null
          email: string | null
          error_message: string | null
          http_status: number | null
          id: string
          input_id: string
          raw: Json
          source: string
          tenant_id: string
          verification_status: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          email?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          input_id: string
          raw?: Json
          source: string
          tenant_id: string
          verification_status?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          email?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          input_id?: string
          raw?: Json
          source?: string
          tenant_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_results_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "enrichment_inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrichment_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          clips_cut: number
          clips_posted: number
          created_at: string
          duration_seconds: number | null
          guest: string
          guest_title: string
          id: string
          platforms: string[]
          processing_state: string
          raw_video_url: string | null
          record_date: string
          show: string
          status: string
          tenant_id: string
          title: string
          transcript: Json | null
          transcript_url: string | null
          updated_at: string
        }
        Insert: {
          clips_cut?: number
          clips_posted?: number
          created_at?: string
          duration_seconds?: number | null
          guest: string
          guest_title?: string
          id?: string
          platforms?: string[]
          processing_state?: string
          raw_video_url?: string | null
          record_date: string
          show: string
          status: string
          tenant_id: string
          title: string
          transcript?: Json | null
          transcript_url?: string | null
          updated_at?: string
        }
        Update: {
          clips_cut?: number
          clips_posted?: number
          created_at?: string
          duration_seconds?: number | null
          guest?: string
          guest_title?: string
          id?: string
          platforms?: string[]
          processing_state?: string
          raw_video_url?: string | null
          record_date?: string
          show?: string
          status?: string
          tenant_id?: string
          title?: string
          transcript?: Json | null
          transcript_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ig_creators: {
        Row: {
          created_at: string
          display_name: string | null
          enabled: boolean
          handle: string
          id: string
          last_synced_at: string | null
          niche: string | null
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          handle: string
          id?: string
          last_synced_at?: string | null
          niche?: string | null
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          handle?: string
          id?: string
          last_synced_at?: string | null
          niche?: string | null
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ig_creators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ig_reels: {
        Row: {
          ai_summary: string | null
          caption: string | null
          comment_count: number | null
          created_at: string
          creator_id: string
          cta_present: boolean | null
          cta_text: string | null
          duration_seconds: number | null
          hashtags: string[] | null
          hook_first_3s: string | null
          hook_pattern: string | null
          id: string
          ig_shortcode: string
          ig_url: string | null
          like_count: number | null
          music_artist: string | null
          music_title: string | null
          niche_relevance: number | null
          posted_at: string | null
          raw: Json
          retention_signal: string | null
          tenant_id: string
          thumbnail_url: string | null
          transcript: string | null
          transcript_language: string | null
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string
          creator_id: string
          cta_present?: boolean | null
          cta_text?: string | null
          duration_seconds?: number | null
          hashtags?: string[] | null
          hook_first_3s?: string | null
          hook_pattern?: string | null
          id?: string
          ig_shortcode: string
          ig_url?: string | null
          like_count?: number | null
          music_artist?: string | null
          music_title?: string | null
          niche_relevance?: number | null
          posted_at?: string | null
          raw?: Json
          retention_signal?: string | null
          tenant_id: string
          thumbnail_url?: string | null
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          caption?: string | null
          comment_count?: number | null
          created_at?: string
          creator_id?: string
          cta_present?: boolean | null
          cta_text?: string | null
          duration_seconds?: number | null
          hashtags?: string[] | null
          hook_first_3s?: string | null
          hook_pattern?: string | null
          id?: string
          ig_shortcode?: string
          ig_url?: string | null
          like_count?: number | null
          music_artist?: string | null
          music_title?: string | null
          niche_relevance?: number | null
          posted_at?: string | null
          raw?: Json
          retention_signal?: string | null
          tenant_id?: string
          thumbnail_url?: string | null
          transcript?: string | null
          transcript_language?: string | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ig_reels_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "ig_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ig_reels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          auto_generated: boolean
          client_email: string
          client_name: string
          created_at: string
          description: string
          due_at: string | null
          id: string
          issued_at: string
          lead_id: string | null
          line_items: Json
          number: string
          paid_at: string | null
          payment_method: string | null
          sent_at: string | null
          status: string
          stripe_hosted_invoice_url: string | null
          stripe_invoice_id: string | null
          stripe_invoice_url: string | null
          stripe_payment_intent: string | null
          subtotal: number
          tax: number
          tenant_id: string
          total: number
          webhook_event_log: Json
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_generated?: boolean
          client_email: string
          client_name: string
          created_at?: string
          description: string
          due_at?: string | null
          id?: string
          issued_at?: string
          lead_id?: string | null
          line_items?: Json
          number: string
          paid_at?: string | null
          payment_method?: string | null
          sent_at?: string | null
          status?: string
          stripe_hosted_invoice_url?: string | null
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          stripe_payment_intent?: string | null
          subtotal: number
          tax?: number
          tenant_id: string
          total: number
          webhook_event_log?: Json
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_generated?: boolean
          client_email?: string
          client_name?: string
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          issued_at?: string
          lead_id?: string | null
          line_items?: Json
          number?: string
          paid_at?: string | null
          payment_method?: string | null
          sent_at?: string | null
          status?: string
          stripe_hosted_invoice_url?: string | null
          stripe_invoice_id?: string | null
          stripe_invoice_url?: string | null
          stripe_payment_intent?: string | null
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
          webhook_event_log?: Json
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_email_sends: {
        Row: {
          created_at: string
          error_message: string | null
          from_stage: string | null
          id: string
          lead_id: string | null
          resend_message_id: string | null
          status: string
          subject: string
          template_id: string | null
          tenant_id: string
          to_email: string
          to_stage: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          from_stage?: string | null
          id?: string
          lead_id?: string | null
          resend_message_id?: string | null
          status: string
          subject: string
          template_id?: string | null
          tenant_id: string
          to_email: string
          to_stage: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          from_stage?: string | null
          id?: string
          lead_id?: string | null
          resend_message_id?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          tenant_id?: string
          to_email?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_email_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lead_email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_email_sends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_email_templates: {
        Row: {
          body_template: string
          created_at: string
          enabled: boolean
          fire_count: number
          from_stage: string | null
          id: string
          last_fired_at: string | null
          name: string
          subject: string
          tenant_id: string
          to_stage: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          enabled?: boolean
          fire_count?: number
          from_stage?: string | null
          id?: string
          last_fired_at?: string | null
          name: string
          subject: string
          tenant_id: string
          to_stage: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          enabled?: boolean
          fire_count?: number
          from_stage?: string | null
          id?: string
          last_fired_at?: string | null
          name?: string
          subject?: string
          tenant_id?: string
          to_stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_id: string
          primary_address: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_id: string
          primary_address?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_id?: string
          primary_address?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_enrichment: {
        Row: {
          fetched_at: string
          id: string
          lead_id: string
          raw: Json
          source: string
          tenant_id: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          lead_id: string
          raw?: Json
          source: string
          tenant_id: string
        }
        Update: {
          fetched_at?: string
          id?: string
          lead_id?: string
          raw?: Json
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_enrichment_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_enrichment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_angle: Json | null
          created_at: string
          days_in_stage: number
          domain: string | null
          enrichment_status: string
          goal: string
          id: string
          name: string
          primary_email: string | null
          source: string
          stage: string
          tenant_id: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          ai_angle?: Json | null
          created_at?: string
          days_in_stage?: number
          domain?: string | null
          enrichment_status?: string
          goal: string
          id?: string
          name: string
          primary_email?: string | null
          source: string
          stage: string
          tenant_id: string
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          ai_angle?: Json | null
          created_at?: string
          days_in_stage?: number
          domain?: string | null
          enrichment_status?: string
          goal?: string
          id?: string
          name?: string
          primary_email?: string | null
          source?: string
          stage?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      makerschool_action_items: {
        Row: {
          created_at: string
          description: string
          id: string
          lesson_id: number | null
          ordering: number | null
          source_type: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lesson_id?: number | null
          ordering?: number | null
          source_type: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lesson_id?: number | null
          ordering?: number | null
          source_type?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "makerschool_action_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "makerschool_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makerschool_action_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "makerschool_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      makerschool_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source_id: string
          source_table: string
          source_type: string
        }
        Insert: {
          chunk_index?: number
          chunk_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id: string
          source_table: string
          source_type: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id?: string
          source_table?: string
          source_type?: string
        }
        Relationships: []
      }
      makerschool_lesson_videos: {
        Row: {
          is_primary: boolean
          lesson_id: number
          video_id: string
        }
        Insert: {
          is_primary?: boolean
          lesson_id: number
          video_id: string
        }
        Update: {
          is_primary?: boolean
          lesson_id?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "makerschool_lesson_videos_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "makerschool_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makerschool_lesson_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "makerschool_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      makerschool_lessons: {
        Row: {
          created_at: string
          day_number: number | null
          download_links: Json | null
          files: Json | null
          id: number
          loom_url: string | null
          loom_urls: string[] | null
          resources: Json | null
          section: string
          status: string | null
          subsection: string | null
          task_number: number | null
          title: string
          url: string | null
          written_content: string | null
        }
        Insert: {
          created_at?: string
          day_number?: number | null
          download_links?: Json | null
          files?: Json | null
          id: number
          loom_url?: string | null
          loom_urls?: string[] | null
          resources?: Json | null
          section: string
          status?: string | null
          subsection?: string | null
          task_number?: number | null
          title: string
          url?: string | null
          written_content?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number | null
          download_links?: Json | null
          files?: Json | null
          id?: number
          loom_url?: string | null
          loom_urls?: string[] | null
          resources?: Json | null
          section?: string
          status?: string | null
          subsection?: string | null
          task_number?: number | null
          title?: string
          url?: string | null
          written_content?: string | null
        }
        Relationships: []
      }
      makerschool_tools: {
        Row: {
          affiliate_url: string | null
          category: string | null
          created_at: string
          description: string | null
          first_appears_day: number | null
          homepage_url: string | null
          id: string
          name: string
          notes: string | null
          pricing_model: string | null
          source_lesson_ids: number[] | null
        }
        Insert: {
          affiliate_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          first_appears_day?: number | null
          homepage_url?: string | null
          id?: string
          name: string
          notes?: string | null
          pricing_model?: string | null
          source_lesson_ids?: number[] | null
        }
        Update: {
          affiliate_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          first_appears_day?: number | null
          homepage_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          pricing_model?: string | null
          source_lesson_ids?: number[] | null
        }
        Relationships: []
      }
      makerschool_videos: {
        Row: {
          attempt_count: number
          chunk_count: number | null
          created_at: string
          download_path: string | null
          duration_seconds: number | null
          error: string | null
          gemini_file_id: string | null
          id: string
          processed_at: string | null
          status: string
          summary: string | null
          transcript: string | null
          url: string
          workflow_configs: string[] | null
        }
        Insert: {
          attempt_count?: number
          chunk_count?: number | null
          created_at?: string
          download_path?: string | null
          duration_seconds?: number | null
          error?: string | null
          gemini_file_id?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          url: string
          workflow_configs?: string[] | null
        }
        Update: {
          attempt_count?: number
          chunk_count?: number | null
          created_at?: string
          download_path?: string | null
          duration_seconds?: number | null
          error?: string | null
          gemini_file_id?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          url?: string
          workflow_configs?: string[] | null
        }
        Relationships: []
      }
      makerschool_workflows: {
        Row: {
          apps: string[] | null
          complexity: string | null
          config: Json | null
          created_at: string
          description: string | null
          display_name: string | null
          filename: string
          fills_named_gap: string | null
          id: string
          inputs: string | null
          module_count: number | null
          naples_module: string | null
          naples_relevance: string | null
          notes: string | null
          outputs: string | null
          platform: string
          port_effort: string | null
          size_bytes: number | null
          trigger_kind: string | null
        }
        Insert: {
          apps?: string[] | null
          complexity?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          filename: string
          fills_named_gap?: string | null
          id?: string
          inputs?: string | null
          module_count?: number | null
          naples_module?: string | null
          naples_relevance?: string | null
          notes?: string | null
          outputs?: string | null
          platform: string
          port_effort?: string | null
          size_bytes?: number | null
          trigger_kind?: string | null
        }
        Update: {
          apps?: string[] | null
          complexity?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          filename?: string
          fills_named_gap?: string | null
          id?: string
          inputs?: string | null
          module_count?: number | null
          naples_module?: string | null
          naples_relevance?: string | null
          notes?: string | null
          outputs?: string | null
          platform?: string
          port_effort?: string | null
          size_bytes?: number | null
          trigger_kind?: string | null
        }
        Relationships: []
      }
      mia_phone_qualifications: {
        Row: {
          asking_price_range: string | null
          bland_call_id: string | null
          call_duration_seconds: number | null
          call_ended_at: string | null
          call_started_at: string | null
          call_status: string
          created_at: string
          id: string
          is_correct_owner: boolean | null
          is_thinking_of_selling: boolean | null
          operator_override: string | null
          owner_name: string
          owner_phone: string
          property_address: string | null
          property_id: string | null
          qualification_score: number | null
          raw: Json
          recommended_followup: string | null
          summary: string | null
          tenant_id: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          asking_price_range?: string | null
          bland_call_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          call_status?: string
          created_at?: string
          id?: string
          is_correct_owner?: boolean | null
          is_thinking_of_selling?: boolean | null
          operator_override?: string | null
          owner_name: string
          owner_phone: string
          property_address?: string | null
          property_id?: string | null
          qualification_score?: number | null
          raw?: Json
          recommended_followup?: string | null
          summary?: string | null
          tenant_id: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          asking_price_range?: string | null
          bland_call_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          call_status?: string
          created_at?: string
          id?: string
          is_correct_owner?: boolean | null
          is_thinking_of_selling?: boolean | null
          operator_override?: string | null
          owner_name?: string
          owner_phone?: string
          property_address?: string | null
          property_id?: string | null
          qualification_score?: number | null
          raw?: Json
          recommended_followup?: string | null
          summary?: string | null
          tenant_id?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mia_phone_qualifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr: {
        Row: {
          content_agency: number
          id: string
          merch: number
          naples_digital_commission: number
          show_sponsors: number
          studio_rental: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content_agency: number
          id?: string
          merch: number
          naples_digital_commission: number
          show_sponsors: number
          studio_rental: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content_agency?: number
          id?: string
          merch?: number
          naples_digital_commission?: number
          show_sponsors?: number
          studio_rental?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrr_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      naples_billing_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          id: string
          payload: Json
          stripe_customer_id: string | null
          stripe_event_id: string
          stripe_event_type: string
          stripe_subscription_id: string | null
          tenant_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          id?: string
          payload?: Json
          stripe_customer_id?: string | null
          stripe_event_id: string
          stripe_event_type: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          id?: string
          payload?: Json
          stripe_customer_id?: string | null
          stripe_event_id?: string
          stripe_event_type?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "naples_billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_day: number
          id: string
          notes: string | null
          paused_at: string | null
          resumed_at: string | null
          started_at: string
          status: string
          tenant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          notes?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          started_at?: string
          status?: string
          tenant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_day?: number
          id?: string
          notes?: string | null
          paused_at?: string | null
          resumed_at?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_step_completions: {
        Row: {
          artifact_link: string | null
          artifact_summary: string | null
          completed_at: string
          completed_by_user_id: string | null
          day: number
          id: string
          notes: string | null
          run_id: string
          step_key: string
          tenant_id: string
        }
        Insert: {
          artifact_link?: string | null
          artifact_summary?: string | null
          completed_at?: string
          completed_by_user_id?: string | null
          day: number
          id?: string
          notes?: string | null
          run_id: string
          step_key: string
          tenant_id: string
        }
        Update: {
          artifact_link?: string | null
          artifact_summary?: string | null
          completed_at?: string
          completed_by_user_id?: string | null
          day?: number
          id?: string
          notes?: string | null
          run_id?: string
          step_key?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_step_completions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "onboarding_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_step_completions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_experiments: {
        Row: {
          created_at: string
          hypothesis: string | null
          id: string
          name: string
          notes: string | null
          status: string
          tenant_id: string
          updated_at: string
          winner_decided_at: string | null
          winner_variant_id: string | null
        }
        Insert: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          winner_decided_at?: string | null
          winner_variant_id?: string | null
        }
        Update: {
          created_at?: string
          hypothesis?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          winner_decided_at?: string | null
          winner_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_experiments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_experiments_winner_variant_id_fkey"
            columns: ["winner_variant_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequence_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_lead_assignments: {
        Row: {
          bounced_at: string | null
          created_at: string
          experiment_id: string
          first_open_at: string | null
          id: string
          lead_email: string
          lead_name: string | null
          pushed_at: string
          raw: Json
          reply_at: string | null
          reply_intent: string | null
          tenant_id: string
          unsubscribed_at: string | null
          updated_at: string
          variant_id: string
          vendor_external_id: string | null
          vendor_kind: string | null
        }
        Insert: {
          bounced_at?: string | null
          created_at?: string
          experiment_id: string
          first_open_at?: string | null
          id?: string
          lead_email: string
          lead_name?: string | null
          pushed_at?: string
          raw?: Json
          reply_at?: string | null
          reply_intent?: string | null
          tenant_id: string
          unsubscribed_at?: string | null
          updated_at?: string
          variant_id: string
          vendor_external_id?: string | null
          vendor_kind?: string | null
        }
        Update: {
          bounced_at?: string | null
          created_at?: string
          experiment_id?: string
          first_open_at?: string | null
          id?: string
          lead_email?: string
          lead_name?: string | null
          pushed_at?: string
          raw?: Json
          reply_at?: string | null
          reply_intent?: string | null
          tenant_id?: string
          unsubscribed_at?: string | null
          updated_at?: string
          variant_id?: string
          vendor_external_id?: string | null
          vendor_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_lead_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outreach_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_lead_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_lead_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequence_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_runs: {
        Row: {
          business_name: string
          business_type: string
          created_at: string
          emails: Json
          goal: string
          id: string
          source: string
          tenant_id: string
        }
        Insert: {
          business_name: string
          business_type: string
          created_at?: string
          emails: Json
          goal: string
          id?: string
          source: string
          tenant_id: string
        }
        Update: {
          business_name?: string
          business_type?: string
          created_at?: string
          emails?: Json
          goal?: string
          id?: string
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequence_variants: {
        Row: {
          bounced_count: number
          created_at: string
          experiment_id: string
          id: string
          name: string
          notes: string | null
          opened_count: number
          positive_reply_count: number
          pushed_count: number
          replied_count: number
          sequence: Json
          tenant_id: string
          traffic_weight: number
          unsubscribed_count: number
          updated_at: string
        }
        Insert: {
          bounced_count?: number
          created_at?: string
          experiment_id: string
          id?: string
          name: string
          notes?: string | null
          opened_count?: number
          positive_reply_count?: number
          pushed_count?: number
          replied_count?: number
          sequence?: Json
          tenant_id: string
          traffic_weight?: number
          unsubscribed_count?: number
          updated_at?: string
        }
        Update: {
          bounced_count?: number
          created_at?: string
          experiment_id?: string
          id?: string
          name?: string
          notes?: string | null
          opened_count?: number
          positive_reply_count?: number
          pushed_count?: number
          replied_count?: number
          sequence?: Json
          tenant_id?: string
          traffic_weight?: number
          unsubscribed_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequence_variants_experiment_fk"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outreach_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sequence_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequences: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          emails: Json
          external_id: string | null
          id: string
          lead_id: string
          pushed_at: string | null
          state: string
          tenant_id: string
          updated_at: string
          vendor: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          emails?: Json
          external_id?: string | null
          id?: string
          lead_id: string
          pushed_at?: string | null
          state?: string
          tenant_id: string
          updated_at?: string
          vendor: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          emails?: Json
          external_id?: string | null
          id?: string
          lead_id?: string
          pushed_at?: string | null
          state?: string
          tenant_id?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_stats: {
        Row: {
          emails_sent_this_week: number
          id: string
          meetings_booked: number
          opens: number
          replies: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          emails_sent_this_week: number
          id?: string
          meetings_booked: number
          opens: number
          replies: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          emails_sent_this_week?: number
          id?: string
          meetings_booked?: number
          opens?: number
          replies?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_episode_inbox: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          episode_id: string | null
          external_guid: string
          feed_id: string
          id: string
          ingested_at: string
          notes: string | null
          promoted_at: string | null
          promoted_by_user_id: string | null
          published_at: string | null
          raw: Json
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          external_guid: string
          feed_id: string
          id?: string
          ingested_at?: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by_user_id?: string | null
          published_at?: string | null
          raw?: Json
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          external_guid?: string
          feed_id?: string
          id?: string
          ingested_at?: string
          notes?: string | null
          promoted_at?: string | null
          promoted_by_user_id?: string | null
          published_at?: string | null
          raw?: Json
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_episode_inbox_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_episode_inbox_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "podcast_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_episode_inbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_feeds: {
        Row: {
          auto_promote: boolean
          created_at: string
          default_show: string | null
          enabled: boolean
          feed_url: string
          id: string
          last_item_published_at: string | null
          last_polled_at: string | null
          name: string | null
          notes: string | null
          poll_interval_minutes: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_promote?: boolean
          created_at?: string
          default_show?: string | null
          enabled?: boolean
          feed_url: string
          id?: string
          last_item_published_at?: string | null
          last_polled_at?: string | null
          name?: string | null
          notes?: string | null
          poll_interval_minutes?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_promote?: boolean
          created_at?: string
          default_show?: string | null
          enabled?: boolean
          feed_url?: string
          id?: string
          last_item_published_at?: string | null
          last_polled_at?: string | null
          name?: string | null
          notes?: string | null
          poll_interval_minutes?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_feeds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projections: {
        Row: {
          conservative: number
          created_at: string
          id: string
          month: string
          realistic: number
          sort_order: number
          tenant_id: string
          upside: number
        }
        Insert: {
          conservative: number
          created_at?: string
          id?: string
          month: string
          realistic: number
          sort_order: number
          tenant_id: string
          upside: number
        }
        Update: {
          conservative?: number
          created_at?: string
          id?: string
          month?: string
          realistic?: number
          sort_order?: number
          tenant_id?: string
          upside?: number
        }
        Relationships: [
          {
            foreignKeyName: "projections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_at: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          deliverables: Json
          expires_at: string | null
          id: string
          intro: string | null
          lead_id: string | null
          metadata: Json
          notes: string | null
          pricing: Json
          public_token: string | null
          responded_at: string | null
          scope_items: Json
          sent_at: string | null
          status: string
          tenant_id: string
          timeline_weeks: number | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          deliverables?: Json
          expires_at?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          pricing?: Json
          public_token?: string | null
          responded_at?: string | null
          scope_items?: Json
          sent_at?: string | null
          status?: string
          tenant_id: string
          timeline_weeks?: number | null
          title?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          deliverables?: Json
          expires_at?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          pricing?: Json
          public_token?: string | null
          responded_at?: string | null
          scope_items?: Json
          sent_at?: string | null
          status?: string
          tenant_id?: string
          timeline_weeks?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_broker_emails: {
        Row: {
          body_text: string | null
          created_at: string
          from_email: string | null
          id: string
          linked_deal_id: string | null
          parsed: Json | null
          received_at: string
          subject: string | null
          tenant_id: string
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          from_email?: string | null
          id?: string
          linked_deal_id?: string | null
          parsed?: Json | null
          received_at?: string
          subject?: string | null
          tenant_id: string
        }
        Update: {
          body_text?: string | null
          created_at?: string
          from_email?: string | null
          id?: string
          linked_deal_id?: string | null
          parsed?: Json | null
          received_at?: string
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_broker_emails_linked_deal_id_fkey"
            columns: ["linked_deal_id"]
            isOneToOne: false
            referencedRelation: "re_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_broker_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_deal_criteria: {
        Row: {
          criteria: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          criteria?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          criteria?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_deal_criteria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_deals: {
        Row: {
          address: string | null
          asking_price: number | null
          broker_company: string | null
          broker_email: string | null
          broker_name: string | null
          broker_phone: string | null
          cap_rate_advertised: number | null
          city: string | null
          created_at: string
          first_seen_at: string
          id: string
          last_seen_at: string
          noi_advertised: number | null
          price_per_unit: number | null
          raw: Json | null
          source: string
          source_listing_id: string | null
          source_url: string | null
          state: string | null
          status: string
          tenant_id: string
          title: string | null
          units: number | null
          updated_at: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          asking_price?: number | null
          broker_company?: string | null
          broker_email?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          cap_rate_advertised?: number | null
          city?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          noi_advertised?: number | null
          price_per_unit?: number | null
          raw?: Json | null
          source: string
          source_listing_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          asking_price?: number | null
          broker_company?: string | null
          broker_email?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          cap_rate_advertised?: number | null
          city?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          noi_advertised?: number | null
          price_per_unit?: number | null
          raw?: Json | null
          source?: string
          source_listing_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_investors: {
        Row: {
          accredited: boolean | null
          created_at: string
          email: string | null
          entity_name: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_asset_classes: string[]
          preferred_geographies: string[]
          target_check_size_max: number | null
          target_check_size_min: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accredited?: boolean | null
          created_at?: string
          email?: string | null
          entity_name?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_asset_classes?: string[]
          preferred_geographies?: string[]
          target_check_size_max?: number | null
          target_check_size_min?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accredited?: boolean | null
          created_at?: string
          email?: string | null
          entity_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_asset_classes?: string[]
          preferred_geographies?: string[]
          target_check_size_max?: number | null
          target_check_size_min?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_investors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_off_market_targets: {
        Row: {
          account_number: string
          address: string | null
          bookmarked: boolean
          city: string | null
          county: string
          created_at: string
          id: string
          last_sale_date: string | null
          last_sale_price: number | null
          owned_for_years: number | null
          owner_address: string | null
          owner_name: string | null
          raw: Json | null
          state: string | null
          tenant_id: string
          units: number | null
          updated_at: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          account_number: string
          address?: string | null
          bookmarked?: boolean
          city?: string | null
          county: string
          created_at?: string
          id?: string
          last_sale_date?: string | null
          last_sale_price?: number | null
          owned_for_years?: number | null
          owner_address?: string | null
          owner_name?: string | null
          raw?: Json | null
          state?: string | null
          tenant_id: string
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          account_number?: string
          address?: string | null
          bookmarked?: boolean
          city?: string | null
          county?: string
          created_at?: string
          id?: string
          last_sale_date?: string | null
          last_sale_price?: number | null
          owned_for_years?: number | null
          owner_address?: string | null
          owner_name?: string | null
          raw?: Json | null
          state?: string | null
          tenant_id?: string
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_off_market_targets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_skiptraces: {
        Row: {
          cost_cents: number | null
          created_at: string
          emails: string[]
          id: string
          llc_unwound_to: string | null
          phones: string[]
          provider: string
          raw: Json | null
          target_id: string | null
          tenant_id: string
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          emails?: string[]
          id?: string
          llc_unwound_to?: string | null
          phones?: string[]
          provider: string
          raw?: Json | null
          target_id?: string | null
          tenant_id: string
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          emails?: string[]
          id?: string
          llc_unwound_to?: string | null
          phones?: string[]
          provider?: string
          raw?: Json | null
          target_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_skiptraces_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "re_off_market_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_skiptraces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_student_deals: {
        Row: {
          address: string | null
          asking_price: number | null
          created_at: string
          id: string
          notes: string | null
          offer_price: number | null
          status: string
          student_id: string
          tenant_id: string
          units: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          asking_price?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          offer_price?: number | null
          status?: string
          student_id: string
          tenant_id: string
          units?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          asking_price?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          offer_price?: number | null
          status?: string
          student_id?: string
          tenant_id?: string
          units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_student_deals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "re_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_student_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_students: {
        Row: {
          created_at: string
          email: string | null
          enrolled_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          target_market: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          enrolled_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          target_market?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          enrolled_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          target_market?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_submarkets: {
        Row: {
          avg_cap_rate: number | null
          avg_occupancy: number | null
          avg_rent_per_unit: number | null
          city: string | null
          created_at: string
          demographics: Json | null
          id: string
          last_refreshed_at: string | null
          name: string
          new_supply_units: number | null
          recent_sales_count: number | null
          state: string | null
          tenant_id: string
        }
        Insert: {
          avg_cap_rate?: number | null
          avg_occupancy?: number | null
          avg_rent_per_unit?: number | null
          city?: string | null
          created_at?: string
          demographics?: Json | null
          id?: string
          last_refreshed_at?: string | null
          name: string
          new_supply_units?: number | null
          recent_sales_count?: number | null
          state?: string | null
          tenant_id: string
        }
        Update: {
          avg_cap_rate?: number | null
          avg_occupancy?: number | null
          avg_rent_per_unit?: number | null
          city?: string | null
          created_at?: string
          demographics?: Json | null
          id?: string
          last_refreshed_at?: string | null
          name?: string
          new_supply_units?: number | null
          recent_sales_count?: number | null
          state?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_submarkets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      re_underwrites: {
        Row: {
          cap_rate_actual: number | null
          created_at: string
          deal_id: string
          dscr_at_market: number | null
          id: string
          inputs: Json
          model_version: string
          noi_estimated: number | null
          qualifying: boolean
          score: number | null
          summary: string | null
          target_irr: number | null
          tenant_id: string
          value_add_upside: number | null
        }
        Insert: {
          cap_rate_actual?: number | null
          created_at?: string
          deal_id: string
          dscr_at_market?: number | null
          id?: string
          inputs?: Json
          model_version: string
          noi_estimated?: number | null
          qualifying?: boolean
          score?: number | null
          summary?: string | null
          target_irr?: number | null
          tenant_id: string
          value_add_upside?: number | null
        }
        Update: {
          cap_rate_actual?: number | null
          created_at?: string
          deal_id?: string
          dscr_at_market?: number | null
          id?: string
          inputs?: Json
          model_version?: string
          noi_estimated?: number | null
          qualifying?: boolean
          score?: number | null
          summary?: string | null
          target_irr?: number | null
          tenant_id?: string
          value_add_upside?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "re_underwrites_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "re_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_underwrites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          clip_id: string
          completed_at: string | null
          created_at: string
          episode_id: string
          error: string | null
          ffmpeg_log: string | null
          id: string
          started_at: string | null
          state: string
          tenant_id: string
        }
        Insert: {
          clip_id: string
          completed_at?: string | null
          created_at?: string
          episode_id: string
          error?: string | null
          ffmpeg_log?: string | null
          id?: string
          started_at?: string | null
          state?: string
          tenant_id: string
        }
        Update: {
          clip_id?: string
          completed_at?: string | null
          created_at?: string
          episode_id?: string
          error?: string | null
          ffmpeg_log?: string | null
          id?: string
          started_at?: string | null
          state?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_phases: {
        Row: {
          created_at: string
          id: string
          items: Json
          label: string
          phase_number: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          label: string
          phase_number: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          label?: string
          phase_number?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_phases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_feeds: {
        Row: {
          category: string | null
          created_at: string
          enabled: boolean
          id: string
          last_item_published_at: string | null
          last_polled_at: string | null
          notes: string | null
          poll_interval_minutes: number
          tenant_id: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_item_published_at?: string | null
          last_polled_at?: string | null
          notes?: string | null
          poll_interval_minutes?: number
          tenant_id: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_item_published_at?: string | null
          last_polled_at?: string | null
          notes?: string | null
          poll_interval_minutes?: number
          tenant_id?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_feeds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_items: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          author: string | null
          body_html: string | null
          body_text: string | null
          commentary_angle: string | null
          commentary_body: string | null
          commentary_generated_at: string | null
          commentary_status: string
          commentary_title: string | null
          created_at: string
          excerpt: string | null
          external_guid: string
          feed_id: string
          id: string
          ingested_at: string
          link: string | null
          published_at: string | null
          published_at_actual: string | null
          published_at_target: string | null
          raw: Json
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          author?: string | null
          body_html?: string | null
          body_text?: string | null
          commentary_angle?: string | null
          commentary_body?: string | null
          commentary_generated_at?: string | null
          commentary_status?: string
          commentary_title?: string | null
          created_at?: string
          excerpt?: string | null
          external_guid: string
          feed_id: string
          id?: string
          ingested_at?: string
          link?: string | null
          published_at?: string | null
          published_at_actual?: string | null
          published_at_target?: string | null
          raw?: Json
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          author?: string | null
          body_html?: string | null
          body_text?: string | null
          commentary_angle?: string | null
          commentary_body?: string | null
          commentary_generated_at?: string | null
          commentary_status?: string
          commentary_title?: string | null
          created_at?: string
          excerpt?: string | null
          external_guid?: string
          feed_id?: string
          id?: string
          ingested_at?: string
          link?: string | null
          published_at?: string | null
          published_at_actual?: string | null
          published_at_target?: string | null
          raw?: Json
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_items_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "rss_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rss_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          created_at: string
          cron_schedule: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          last_run_status: string | null
          name: string
          niche: string | null
          params: Json
          source: string
          target_locations: string[] | null
          target_titles: string[] | null
          tenant_id: string
          total_leads_added: number
          total_runs: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_schedule?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          name: string
          niche?: string | null
          params?: Json
          source: string
          target_locations?: string[] | null
          target_titles?: string[] | null
          tenant_id: string
          total_leads_added?: number
          total_runs?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_schedule?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          name?: string
          niche?: string | null
          params?: Json
          source?: string
          target_locations?: string[] | null
          target_titles?: string[] | null
          tenant_id?: string
          total_leads_added?: number
          total_runs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicate_count: number
          error_message: string | null
          fetched_count: number
          filtered_count: number
          id: string
          inserted_count: number
          job_id: string
          raw_results_url: string | null
          source: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicate_count?: number
          error_message?: string | null
          fetched_count?: number
          filtered_count?: number
          id?: string
          inserted_count?: number
          job_id: string
          raw_results_url?: string | null
          source: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicate_count?: number
          error_message?: string | null
          fetched_count?: number
          filtered_count?: number
          id?: string
          inserted_count?: number
          job_id?: string
          raw_results_url?: string | null
          source?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scrape_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_growth: {
        Row: {
          created_at: string
          facebook: number
          id: string
          instagram: number
          tenant_id: string
          tiktok: number
          week: string
          youtube: number
        }
        Insert: {
          created_at?: string
          facebook: number
          id?: string
          instagram: number
          tenant_id: string
          tiktok: number
          week: string
          youtube: number
        }
        Update: {
          created_at?: string
          facebook?: number
          id?: string
          instagram?: number
          tenant_id?: string
          tiktok?: number
          week?: string
          youtube?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_growth_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_metrics: {
        Row: {
          clip_plays: number
          created_at: string
          id: string
          impressions: number
          mentions: number
          sponsor_id: string
          tenant_id: string
          week: string
        }
        Insert: {
          clip_plays?: number
          created_at?: string
          id?: string
          impressions?: number
          mentions?: number
          sponsor_id: string
          tenant_id: string
          week: string
        }
        Update: {
          clip_plays?: number
          created_at?: string
          id?: string
          impressions?: number
          mentions?: number
          sponsor_id?: string
          tenant_id?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_metrics_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_pitches: {
        Row: {
          audience_match: string
          created_at: string
          id: string
          integration_ideas: Json
          package_recommendation: Json
          show: string
          source: string
          sponsor_name: string
          tenant_id: string
        }
        Insert: {
          audience_match: string
          created_at?: string
          id?: string
          integration_ideas: Json
          package_recommendation: Json
          show: string
          source: string
          sponsor_name: string
          tenant_id: string
        }
        Update: {
          audience_match?: string
          created_at?: string
          id?: string
          integration_ideas?: Json
          package_recommendation?: Json
          show?: string
          source?: string
          sponsor_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_pitches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          magic_link_token: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          magic_link_token?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          magic_link_token?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          kind: string
          last_verified_at: string | null
          secret_ref: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          kind: string
          last_verified_at?: string | null
          secret_ref?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          last_verified_at?: string | null
          secret_ref?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_voice_profiles: {
        Row: {
          created_at: string
          enabled: boolean
          fingerprint: Json
          generated_at: string
          id: string
          quality_flags: string[] | null
          samples: Json
          samples_count: number
          tenant_id: string
          updated_at: string
          voice_summary: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          fingerprint?: Json
          generated_at?: string
          id?: string
          quality_flags?: string[] | null
          samples?: Json
          samples_count?: number
          tenant_id: string
          updated_at?: string
          voice_summary?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          fingerprint?: Json
          generated_at?: string
          id?: string
          quality_flags?: string[] | null
          samples?: Json
          samples_count?: number
          tenant_id?: string
          updated_at?: string
          voice_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_voice_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          addons: string[]
          billing_email: string | null
          billing_status: string
          brand: Json
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          enabled_modules: string[]
          id: string
          name: string
          plan: string
          slug: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          addons?: string[]
          billing_email?: string | null
          billing_status?: string
          brand?: Json
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          enabled_modules?: string[]
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          addons?: string[]
          billing_email?: string | null
          billing_status?: string
          brand?: Json
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          enabled_modules?: string[]
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_tenant_id: { Args: never; Returns: string }
      delete_tenant_secret: {
        Args: { p_kind: string; p_tenant_id: string }
        Returns: boolean
      }
      get_tenant_secret: {
        Args: { p_kind: string; p_tenant_id: string }
        Returns: {
          out_config: Json
          out_last_verified_at: string
          out_secret: string
          out_status: string
        }[]
      }
      makerschool_search: {
        Args: {
          match_count?: number
          query_embedding: string
          source_filter?: string[]
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_table: string
          source_type: string
        }[]
      }
      set_current_tenant: { Args: { tenant_id: string }; Returns: undefined }
      set_tenant_secret: {
        Args: {
          p_config?: Json
          p_kind: string
          p_secret: string
          p_tenant_id: string
        }
        Returns: {
          out_id: string
          out_kind: string
          out_last_verified_at: string
          out_status: string
          out_tenant_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
