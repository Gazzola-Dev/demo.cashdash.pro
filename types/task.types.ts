import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";

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
