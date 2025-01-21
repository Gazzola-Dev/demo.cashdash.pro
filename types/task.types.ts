import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

// Base types from database
type Project = Tables<"projects">;
type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;
type Subtask = Tables<"subtasks">;
type BaseComment = Tables<"comments">;
type TaskSchedule = Tables<"task_schedule">;

// Extended Comment type that includes user profile
interface Comment extends BaseComment {
  user: Profile;
}

// Task with base data and all relationships
export interface TaskResult {
  task: Task;
  subtasks: Subtask[];
  comments?: Comment[] | null;
  task_schedule: TaskSchedule[];
  assignee_profile: Profile | null;
  project: Project | null;
}

// Response types
export interface TaskResponse extends ActionResponse<TaskResult> {}
export interface TaskListResponse extends ActionResponse<TaskResult[]> {}

// Filter types for listing tasks
export interface TaskFilters {
  projectSlug?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assignee?: string;
  search?: string;
  sort?: keyof Task;
  order?: "asc" | "desc";
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
