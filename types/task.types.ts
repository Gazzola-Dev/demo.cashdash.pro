// task.types.ts
import { Tables } from "@/types/database.types";

export interface TaskWithProfile extends Tables<"tasks"> {
  assignee_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subtasks?: Tables<"subtasks">[];
  task_tags?: {
    tag_id: string;
    tags: Tables<"tags">;
  }[];
  comments?: (Tables<"comments"> & {
    user: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  })[];
  task_schedule?: Tables<"task_schedule">[];
  attachments?: Tables<"attachments">[];
}

export interface TaskResponse {
  data: TaskWithProfile | null;
  error: string | null;
}

export interface TaskListResponse {
  data: TaskWithProfile[] | null;
  error: string | null;
}
