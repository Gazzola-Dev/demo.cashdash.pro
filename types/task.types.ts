import { ActionResponse } from "@/types/action.types";
import { CommentWithProfile } from "@/types/comment.types";
import { Tables } from "@/types/database.types";
import { ProfileWithDetails } from "@/types/profile.types";

// Base types from database
type Project = Tables<"projects">;
type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;
type Subtask = Tables<"subtasks">;
type BaseComment = Tables<"comments">;
type TaskSchedule = Tables<"task_schedule">;

// Required project type ensures all project fields are non-null
export interface RequiredProject extends Project {
  id: NonNullable<Project["id"]>;
  name: NonNullable<Project["name"]>;
  description: Project["description"];
  status: NonNullable<Project["status"]>;
  slug: NonNullable<Project["slug"]>;
  prefix: NonNullable<Project["prefix"]>;
  github_repo_url: Project["github_repo_url"];
  github_owner: Project["github_owner"];
  github_repo: Project["github_repo"];
  created_at: NonNullable<Project["created_at"]>;
  updated_at: NonNullable<Project["updated_at"]>;
}

// Task with project relationship
export interface TaskWithProject extends Task {
  project: RequiredProject;
  ordinal_id: NonNullable<Task["ordinal_id"]>;
}

// Extended Comment type that includes user profile
interface Comment extends BaseComment {
  profile: ProfileWithDetails;
}

// Updated TaskSchedule type to explicitly handle timestamps
export interface TaskScheduleWithTimestamps
  extends Partial<Omit<TaskSchedule, "start_date" | "due_date">> {
  start_date?: string | null; // ISO timestamp string
  due_date?: string | null; // ISO timestamp string
}

// Task with base data and all relationships
export interface TaskResult {
  task: Task;
  subtasks: Subtask[];
  comments?: CommentWithProfile[] | null;
  task_schedule: TaskScheduleWithTimestamps | null;
  assignee_profile: Profile | null;
  project: Project | null;
}

// Response types
export interface TaskResponse extends ActionResponse<TaskResult> {}
export interface TaskListResponse extends ActionResponse<TaskResult[]> {}
export interface SubtaskResponse extends ActionResponse<Subtask> {}

// Filter types for listing tasks
export interface TaskFilters {
  projectSlug?: string | null;
  status?: Tables<"tasks">["status"];
  priority?: Tables<"tasks">["priority"];
  assignee?: string;
  search?: string;
  sort?: keyof Tables<"tasks">;
  order?: "asc" | "desc";
}

// Updated TaskUpdate type to include subtask updates
export interface SubtaskUpdate extends Partial<Subtask> {
  id: string;
}

// Subtask input type for creation
export interface SubtaskInput {
  task_id: Subtask["task_id"];
  title: Subtask["title"];
  description?: Subtask["description"];
  status?: Subtask["status"];
  budget_cents?: Subtask["budget_cents"];
}

export interface TaskUpdate extends Partial<Tables<"tasks">> {
  id: string;
}

// Updated task update types to include subtask updates
export interface TaskUpdateWithSubtasks extends Partial<Task> {
  id?: string;
  subtasks?: SubtaskUpdate[];
  task_schedule?: TaskScheduleWithTimestamps;
}

export const STATUS_OPTIONS: Tables<"tasks">["status"][] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "completed",
  "draft",
];

export const PRIORITY_OPTIONS: Tables<"tasks">["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];
