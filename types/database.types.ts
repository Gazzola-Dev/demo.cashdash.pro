export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          timestamp: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          timestamp?: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          timestamp?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          content_id: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id: string;
          storage_path: string;
          uploaded_by: string;
        };
        Insert: {
          content_id: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          file_name: string;
          file_size: number;
          file_type: string;
          id?: string;
          storage_path: string;
          uploaded_by: string;
        };
        Update: {
          content_id?: string;
          content_type?: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          storage_path?: string;
          uploaded_by?: string;
        };
        Relationships: [];
      };
      comment_reactions: {
        Row: {
          comment_id: string;
          id: string;
          reaction: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          id?: string;
          reaction: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          id?: string;
          reaction?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          content: Json;
          content_id: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at: string;
          id: string;
          is_edited: boolean;
          parent_id: string | null;
          thread_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: Json;
          content_id: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          id?: string;
          is_edited?: boolean;
          parent_id?: string | null;
          thread_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          content_id?: string;
          content_type?: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          id?: string;
          is_edited?: boolean;
          parent_id?: string | null;
          thread_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      external_integrations: {
        Row: {
          credentials: Json | null;
          id: string;
          project_id: string;
          provider: string;
          settings: Json | null;
        };
        Insert: {
          credentials?: Json | null;
          id?: string;
          project_id: string;
          provider: string;
          settings?: Json | null;
        };
        Update: {
          credentials?: Json | null;
          id?: string;
          project_id?: string;
          provider?: string;
          settings?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "external_integrations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_invitations: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          project_id: string;
          role: string;
          status: Database["public"]["Enums"]["invitation_status"];
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          project_id: string;
          role: string;
          status?: Database["public"]["Enums"]["invitation_status"];
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          project_id?: string;
          role?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
        };
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          created_at: string;
          id: string;
          project_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          project_id: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_metrics: {
        Row: {
          burn_rate_cents: number | null;
          completion_percentage: number | null;
          date: string;
          id: string;
          project_id: string;
          velocity: number | null;
        };
        Insert: {
          burn_rate_cents?: number | null;
          completion_percentage?: number | null;
          date: string;
          id?: string;
          project_id: string;
          velocity?: number | null;
        };
        Update: {
          burn_rate_cents?: number | null;
          completion_percentage?: number | null;
          date?: string;
          id?: string;
          project_id?: string;
          velocity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: Json | null;
          github_owner: string | null;
          github_repo: string | null;
          github_repo_url: string | null;
          id: string;
          name: string;
          prefix: string;
          slug: string;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: Json | null;
          github_owner?: string | null;
          github_repo?: string | null;
          github_repo_url?: string | null;
          id?: string;
          name: string;
          prefix: string;
          slug: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: Json | null;
          github_owner?: string | null;
          github_repo?: string | null;
          github_repo_url?: string | null;
          id?: string;
          name?: string;
          prefix?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: number;
          permission: Database["public"]["Enums"]["app_permission"];
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          id?: number;
          permission: Database["public"]["Enums"]["app_permission"];
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          id?: number;
          permission?: Database["public"]["Enums"]["app_permission"];
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      subtasks: {
        Row: {
          budget_cents: number | null;
          created_at: string;
          description: Json | null;
          id: string;
          ordinal_id: number;
          status: Database["public"]["Enums"]["task_status"];
          task_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          budget_cents?: number | null;
          created_at?: string;
          description?: Json | null;
          id?: string;
          ordinal_id: number;
          status?: Database["public"]["Enums"]["task_status"];
          task_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          budget_cents?: number | null;
          created_at?: string;
          description?: Json | null;
          id?: string;
          ordinal_id?: number;
          status?: Database["public"]["Enums"]["task_status"];
          task_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string;
          id: string;
          name: string;
        };
        Insert: {
          color: string;
          id?: string;
          name: string;
        };
        Update: {
          color?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      task_schedule: {
        Row: {
          actual_hours: number | null;
          completed_at: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          id: string;
          start_date: string | null;
          task_id: string;
        };
        Insert: {
          actual_hours?: number | null;
          completed_at?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          start_date?: string | null;
          task_id: string;
        };
        Update: {
          actual_hours?: number | null;
          completed_at?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          start_date?: string | null;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_schedule_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_tags: {
        Row: {
          tag_id: string;
          task_id: string;
        };
        Insert: {
          tag_id: string;
          task_id: string;
        };
        Update: {
          tag_id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_tags_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assignee: string | null;
          budget_cents: number | null;
          created_at: string;
          description: Json | null;
          id: string;
          ordinal_id: number;
          prefix: string;
          priority: Database["public"]["Enums"]["task_priority"];
          project_id: string;
          slug: string;
          status: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          assignee?: string | null;
          budget_cents?: number | null;
          created_at?: string;
          description?: Json | null;
          id?: string;
          ordinal_id: number;
          prefix: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id: string;
          slug: string;
          status?: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee?: string | null;
          budget_cents?: number | null;
          created_at?: string;
          description?: Json | null;
          id?: string;
          ordinal_id?: number;
          prefix?: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          project_id?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"];
        };
        Returns: boolean;
      };
      custom_access_token_hook: {
        Args: {
          event: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_permission:
        | "products.manage"
        | "orders.manage"
        | "users.manage"
        | "site.settings";
      app_role: "admin";
      content_type: "project" | "task" | "subtask" | "comment";
      invitation_status: "pending" | "accepted" | "declined" | "expired";
      project_status: "active" | "archived" | "completed";
      task_priority: "low" | "medium" | "high" | "urgent";
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "in_review"
        | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

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
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
