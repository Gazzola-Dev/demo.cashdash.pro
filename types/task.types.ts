import { ActionResponse } from "@/types/action.types";
import { Json, Tables } from "@/types/database.types";

// Base types from database
type Project = Tables<"projects">;
type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;
type Subtask = Tables<"subtasks">;
type TaskTag = Tables<"task_tags">;
type Tag = Tables<"tags">;
type Comment = Tables<"comments">;
type TaskSchedule = Tables<"task_schedule">;

// Define strict project type without nullable fields
export interface RequiredProject {
  id: Project["id"];
  name: Project["name"];
  description: Project["description"];
  status: Project["status"];
  slug: Project["slug"];
  prefix: Project["prefix"];
  github_repo_url: Project["github_repo_url"];
  github_owner: Project["github_owner"];
  github_repo: Project["github_repo"];
  created_at: Project["created_at"];
  updated_at: Project["updated_at"];
}

// Task with non-nullable Project
export interface TaskWithProject extends Task {
  project: RequiredProject;
}

// Task with all relationships
export interface TaskWithDetails extends TaskWithProject {
  assignee_profile?: Profile | null;
  subtasks?: Subtask[];
  task_tags?: (TaskTag & { tags: Tag })[];
  comments?: (Comment & {
    user: Profile;
  })[];
  task_schedule?: TaskSchedule[];
}

// Response types
export interface TaskResponse extends ActionResponse<TaskWithDetails> {}
export interface TaskListResponse extends ActionResponse<TaskWithDetails[]> {}

// Filter types for listing tasks
export interface TaskFilters {
  projectId?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assignee?: string;
  search?: string;
  sort?: keyof Task;
  order?: "asc" | "desc";
}

// Task creation/update types
export interface TaskInput {
  project_id: Task["project_id"];
  title: Task["title"];
  description?: Task["description"];
  status?: Task["status"];
  priority?: Task["priority"];
  slug: Task["slug"];
  prefix: Task["prefix"];
  assignee?: Task["assignee"];
  budget_cents?: Task["budget_cents"];
}

export interface TaskUpdate extends Partial<TaskInput> {
  id: string;
}

// Define the base user type
export type UserProfile = {
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  current_project_id: string | null;
  display_name: string | null;
  github_username: string | null;
  id: string;
  notification_preferences: Json;
  updated_at: string;
  username: string;
  website: string | null;
};

// Define the normalized task data type
export type NormalizedTaskData = Omit<TaskWithDetails, "comments"> & {
  comments:
    | Array<{
        content: Json;
        content_id: string;
        content_type: "project" | "task" | "subtask" | "comment";
        created_at: string;
        id: string;
        is_edited: boolean;
        parent_id: string | null;
        thread_id: string | null;
        updated_at: string;
        user_id: string;
        user: UserProfile;
      }>
    | undefined;
};

export const STATUS_OPTIONS: Tables<"tasks">["status"][] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "completed",
];

export const PRIORITY_OPTIONS: Tables<"tasks">["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export interface TaskTableProps {
  projectId: string;
  projectSlug: string;
}
