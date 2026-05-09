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
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_email?: string
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
      tenants: {
        Row: {
          addons: string[]
          brand: Json
          created_at: string
          enabled_modules: string[]
          id: string
          name: string
          plan: string
          slug: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          addons?: string[]
          brand?: Json
          created_at?: string
          enabled_modules?: string[]
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          addons?: string[]
          brand?: Json
          created_at?: string
          enabled_modules?: string[]
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
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

