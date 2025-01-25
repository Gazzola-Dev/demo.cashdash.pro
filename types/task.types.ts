import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

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
  user: Profile;
}

// Updated TaskSchedule type to explicitly handle timestamps
export interface TaskScheduleWithTimestamps
  extends Omit<TaskSchedule, "start_date" | "due_date"> {
  start_date: string | null; // ISO timestamp string
  due_date: string | null; // ISO timestamp string
}

// Task with base data and all relationships
export interface TaskResult {
  task: Task;
  subtasks: Subtask[];
  comments?: Comment[] | null;
  task_schedule: TaskScheduleWithTimestamps | null;
  assignee_profile: Profile | null;
  project: Project | null;
}

// Response types
export interface TaskResponse extends ActionResponse<TaskResult> {}
export interface TaskListResponse extends ActionResponse<TaskResult[]> {}

// Filter types for listing tasks
export interface TaskFilters {
  projectSlug: string;
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

// Task input types for creation/updates
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

// Updated task update types to include subtask updates
export interface TaskUpdateWithSubtasks extends Partial<TaskInput> {
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
