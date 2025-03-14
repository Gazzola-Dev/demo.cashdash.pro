export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          action: string
          actor_id: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          action?: string
          actor_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          is_edited: boolean
          parent_id: string | null
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_approvals: {
        Row: {
          approval_type: string
          approved: boolean
          contract_id: string
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          approval_type: string
          approved?: boolean
          contract_id: string
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          approval_type?: string
          approved?: boolean
          contract_id?: string
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_approvals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_members: {
        Row: {
          contract_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          contract_id: string
          id?: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          contract_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_members_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          amount_cents: number
          completed_at: string | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          status: Database["public"]["Enums"]["contract_milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          status?: Database["public"]["Enums"]["contract_milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          status?: Database["public"]["Enums"]["contract_milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount_cents: number
          contract_id: string
          created_at: string
          id: string
          milestone_id: string | null
          payee_id: string | null
          payer_id: string | null
          payment_date: string | null
          payment_id: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          contract_id: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          payee_id?: string | null
          payer_id?: string | null
          payment_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          contract_id?: string
          created_at?: string
          id?: string
          milestone_id?: string | null
          payee_id?: string | null
          payer_id?: string | null
          payment_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "contract_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_company: string | null
          client_name: string
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          id: string
          project_id: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          total_amount_cents: number
          updated_at: string
          upwork_contract_id: string
        }
        Insert: {
          client_company?: string | null
          client_name: string
          created_at?: string
          currency: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          total_amount_cents: number
          updated_at?: string
          upwork_contract_id: string
        }
        Update: {
          client_company?: string | null
          client_name?: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          total_amount_cents?: number
          updated_at?: string
          upwork_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          credentials: Json | null
          id: string
          project_id: string
          provider: string
          settings: Json | null
        }
        Insert: {
          credentials?: Json | null
          id?: string
          project_id: string
          provider: string
          settings?: Json | null
        }
        Update: {
          credentials?: Json | null
          id?: string
          project_id?: string
          provider?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_approvals: {
        Row: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          approved: boolean
          id: string
          milestone_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          approved?: boolean
          id?: string
          milestone_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          approval_type?: Database["public"]["Enums"]["approval_type"]
          approved?: boolean
          id?: string
          milestone_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_approvals_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_disputes: {
        Row: {
          created_at: string
          id: string
          milestone_id: string
          opener_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          milestone_id: string
          opener_id: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          milestone_id?: string
          opener_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_disputes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["actor_role"]
          created_at: string
          details: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          icon_type: string | null
          id: string
          metadata: Json | null
          milestone_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role: Database["public"]["Enums"]["actor_role"]
          created_at?: string
          details?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          icon_type?: string | null
          id?: string
          metadata?: Json | null
          milestone_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["actor_role"]
          created_at?: string
          details?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          icon_type?: string | null
          id?: string
          metadata?: Json | null
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_events_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_tasks: {
        Row: {
          created_at: string
          milestone_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          milestone_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          milestone_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          payment_cents: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          payment_cents?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          payment_cents?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          message: string
          recipient_id: string
          seen: boolean
          url_path: string | null
        }
        Insert: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          message: string
          recipient_id: string
          seen?: boolean
          url_path?: string | null
        }
        Update: {
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string
          seen?: boolean
          url_path?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_project_id: string | null
          display_name: string | null
          email: string
          github_username: string | null
          id: string
          notification_preferences: Json | null
          professional_title: string | null
          timezone: string | null
          ui_preferences: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_project_id?: string | null
          display_name?: string | null
          email: string
          github_username?: string | null
          id: string
          notification_preferences?: Json | null
          professional_title?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_project_id?: string | null
          display_name?: string | null
          email?: string
          github_username?: string | null
          id?: string
          notification_preferences?: Json | null
          professional_title?: string | null
          timezone?: string | null
          ui_preferences?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          project_id: string
          role: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_metrics: {
        Row: {
          burn_rate_cents: number | null
          completion_percentage: number | null
          date: string
          id: string
          project_id: string
          velocity: number | null
        }
        Insert: {
          burn_rate_cents?: number | null
          completion_percentage?: number | null
          date: string
          id?: string
          project_id: string
          velocity?: number | null
        }
        Update: {
          burn_rate_cents?: number | null
          completion_percentage?: number | null
          date?: string
          id?: string
          project_id?: string
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subscriptions: {
        Row: {
          amount_cents: number
          created_at: string
          end_date: string
          id: string
          metadata: Json | null
          payment_intent_id: string
          project_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          end_date: string
          id?: string
          metadata?: Json | null
          payment_intent_id: string
          project_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          end_date?: string
          id?: string
          metadata?: Json | null
          payment_intent_id?: string
          project_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          current_milestone_id: string | null
          description: string | null
          github_owner: string | null
          github_repo: string | null
          github_repo_url: string | null
          icon_color_bg: string | null
          icon_color_fg: string | null
          icon_name: string | null
          id: string
          name: string
          prefix: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_milestone_id?: string | null
          description?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_repo_url?: string | null
          icon_color_bg?: string | null
          icon_color_fg?: string | null
          icon_name?: string | null
          id?: string
          name: string
          prefix: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_milestone_id?: string | null
          description?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_repo_url?: string | null
          icon_color_bg?: string | null
          icon_color_fg?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          prefix?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_current_milestone_id_fkey"
            columns: ["current_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          budget_cents: number | null
          created_at: string
          description: string | null
          id: string
          ordinal_id: number
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ordinal_id: number
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ordinal_id?: number
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          id: string
          name: string
        }
        Insert: {
          color: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_schedule: {
        Row: {
          actual_hours: number | null
          completed_at: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          start_date: string | null
          task_id: string
        }
        Insert: {
          actual_hours?: number | null
          completed_at?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          start_date?: string | null
          task_id: string
        }
        Update: {
          actual_hours?: number | null
          completed_at?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          start_date?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_schedule_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          budget_cents: number | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          ordinal_id: number
          ordinal_priority: number
          prefix: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          recorded_minutes: number | null
          slug: string
          start_time: number | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          ordinal_id: number
          ordinal_priority: number
          prefix: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          recorded_minutes?: number | null
          slug: string
          start_time?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          ordinal_id?: number
          ordinal_priority?: number
          prefix?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          recorded_minutes?: number | null
          slug?: string
          start_time?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      milestone_events_view: {
        Row: {
          action: string | null
          actor_avatar: string | null
          actor_id: string | null
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["actor_role"] | null
          created_at: string | null
          details: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          icon_type: string | null
          id: string | null
          milestone_id: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_events_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      check_profile_exists: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      citext:
        | {
            Args: {
              "": boolean
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string
          }
      citext_hash: {
        Args: {
          "": string
        }
        Returns: number
      }
      citextin: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextout: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      citextrecv: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextsend: {
        Args: {
          "": string
        }
        Returns: string
      }
      create_comment_data: {
        Args: {
          comment_content: string
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          user_id: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_recipient_id: string
          p_content_id: string
          p_content_type: Database["public"]["Enums"]["content_type"]
          p_message: string
          p_url_path?: string
        }
        Returns: {
          content_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          message: string
          recipient_id: string
          seen: boolean
          url_path: string | null
        }
      }
      create_project_with_owner: {
        Args: {
          p_name: string
          p_description: string
          p_prefix: string
          p_slug: string
          p_owner_id: string
        }
        Returns: Json
      }
      custom_access_token_hook: {
        Args: {
          event: Json
        }
        Returns: Json
      }
      delete_project: {
        Args: {
          p_project_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      delete_project_data: {
        Args: {
          project_id: string
        }
        Returns: undefined
      }
      delete_project_invitation: {
        Args: {
          p_invitation_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      delete_project_member: {
        Args: {
          p_member_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      direct_set_project_milestone: {
        Args: {
          p_project_id: string
          p_milestone_id: string
        }
        Returns: boolean
      }
      generate_unique_slug: {
        Args: {
          base_slug: string
          table_name: string
          existing_id?: string
        }
        Returns: string
      }
      get_app_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      get_contract_by_milestone: {
        Args: {
          p_milestone_id: string
        }
        Returns: Json
      }
      get_current_project_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      get_layout_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      get_layout_user_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      get_milestone_events: {
        Args: {
          milestone_id: string
        }
        Returns: Json[]
      }
      get_priority_tasks_data:
        | {
            Args: {
              p_limit?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
              p_limit?: number
            }
            Returns: Json
          }
      get_profile_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              user_id: string
            }
            Returns: Json
          }
      get_project_data: {
        Args: {
          project_slug: string
        }
        Returns: Json
      }
      get_recent_tasks_data:
        | {
            Args: {
              p_limit?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
              p_limit?: number
            }
            Returns: Json
          }
      get_task: {
        Args: {
          task_identifier: string
        }
        Returns: Json
      }
      get_task_data: {
        Args: {
          task_slug: string
        }
        Returns: Json
      }
      get_user_invites: {
        Args: {
          p_email: string
        }
        Returns: Json
      }
      get_user_projects_data:
        | {
            Args: Record<PropertyKey, never>
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      handle_invitation_response: {
        Args: {
          p_invitation_id: string
          p_user_id: string
          p_accept: boolean
        }
        Returns: Json
      }
      invite_member_to_project: {
        Args: {
          p_project_id: string
          p_inviter_id: string
          p_email: string
          p_role: string
          p_expires_at?: string
        }
        Returns: Json
      }
      list_milestone_events: {
        Args: {
          p_milestone_id: string
        }
        Returns: Json[]
      }
      list_project_members: {
        Args: {
          project_slug: string
        }
        Returns: Json[]
      }
      list_project_milestones: {
        Args: {
          project_slug: string
        }
        Returns: Json[]
      }
      list_project_tasks: {
        Args: {
          project_slug: string
        }
        Returns: Json[]
      }
      list_projects: {
        Args: {
          p_search?: string
          p_status?: string
          p_sort_column?: string
          p_sort_order?: string
        }
        Returns: Json[]
      }
      list_tasks: {
        Args: {
          p_project_id?: string
          p_status?: string
          p_priority?: string
          p_assignee?: string
          p_search?: string
          p_sort_column?: string
          p_sort_order?: string
        }
        Returns: Json
      }
      log_debug: {
        Args: {
          log_message: string
        }
        Returns: undefined
      }
      mark_all_notifications_seen: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      populate_contract_members: {
        Args: {
          p_contract_id: string
        }
        Returns: undefined
      }
      set_project_current_milestone: {
        Args: {
          p_project_id: string
          p_milestone_id: string
        }
        Returns: boolean
      }
      set_user_current_project: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: undefined
      }
      to_kebab_case: {
        Args: {
          text_input: string
        }
        Returns: string
      }
      update_comment_data: {
        Args: {
          comment_id: string
          comment_content: string
          user_id: string
        }
        Returns: Json
      }
      update_profile_data: {
        Args: {
          p_user_id: string
          p_updates: Json
        }
        Returns: Json
      }
      update_project_data: {
        Args: {
          p_project_id: string
          p_updates: Json
          p_user_id: string
        }
        Returns: Json
      }
      update_subtask_data: {
        Args: {
          subtask_id: string
          subtask_updates: Json
        }
        Returns: Json
      }
      update_task_data: {
        Args: {
          task_slug: string
          task_updates: Json
        }
        Returns: Json
      }
      update_task_priority: {
        Args: {
          p_task_id: string
          p_new_priority: Database["public"]["Enums"]["task_priority"]
          p_new_ordinal_priority?: number
        }
        Returns: undefined
      }
      upsert_draft_task: {
        Args: {
          p_project_slug: string
        }
        Returns: Json
      }
      validate_task_dates: {
        Args: {
          start_date: string
          due_date: string
        }
        Returns: boolean
      }
    }
    Enums: {
      actor_role: "pm" | "client" | "system" | "developer"
      app_permission:
        | "products.manage"
        | "orders.manage"
        | "users.manage"
        | "site.settings"
      app_role: "admin"
      approval_type: "payment" | "completion" | "cancellation"
      content_type: "project" | "task" | "milestone" | "subtask" | "comment"
      contract_milestone_status: "pending" | "funded" | "released"
      contract_status: "active" | "completed" | "cancelled"
      dispute_status: "open" | "resolved"
      event_type:
        | "creation"
        | "update"
        | "status_change"
        | "price_change"
        | "date_change"
        | "approval"
        | "system_notification"
        | "dispute"
        | "completion"
      invitation_status: "pending" | "accepted" | "declined" | "expired"
      milestone_status: "draft" | "active" | "completed" | "archived"
      milestone_status_old:
        | "draft"
        | "backlog"
        | "planned"
        | "in_progress"
        | "in_review"
        | "completed"
      payment_status:
        | "pending"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
        | "disputed"
      project_status: "active" | "archived" | "completed"
      subscription_status:
        | "active"
        | "canceled"
        | "expired"
        | "past_due"
        | "trialing"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "draft"
        | "backlog"
        | "todo"
        | "in_progress"
        | "in_review"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
