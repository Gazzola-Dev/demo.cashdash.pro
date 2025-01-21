import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { ActionResponse } from "@/types/action.types";
import { TablesInsert, TablesUpdate } from "@/types/database.types";
import { TaskFilters, TaskWithDetails } from "@/types/task.types";

export const listTasksAction = async (
  filters?: TaskFilters,
): Promise<ActionResponse<TaskWithDetails[]>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    let query = supabase.from("tasks").select(`
      *,
      project:projects (*),
      subtasks (*),
      task_tags (
        tags (*)
      ),
      task_schedule (*)
    `);

    if (filters?.projectId) {
      query = query.eq("project_id", filters.projectId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.assignee) {
      query = query.eq("assignee", filters.assignee);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    if (filters?.sort) {
      query = query.order(filters.sort, { ascending: filters.order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    const tasksWithDetails = data as unknown as TaskWithDetails[];

    return getActionResponse({ data: tasksWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const getTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects!inner(*),
        subtasks(*),
        task_tags!inner(
          tag_id,
          task_id,
          tags!inner(*)
        ),
        task_schedule(*),
        comments:comments!content_id(
          *,
          user:profiles!user_id(*)
        )
      `,
      )
      .eq("slug", taskSlug)
      .eq("comments.content_type", "task")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Task not found");

    // Transform the data to match TaskWithDetails type
    const taskWithDetails: TaskWithDetails = {
      ...data,
      project: data.project,
      subtasks: data.subtasks || [],
      task_tags: data.task_tags
        .filter(
          (tt): tt is typeof tt & { tags: NonNullable<typeof tt.tags> } =>
            tt.tags !== null,
        )
        .map(tt => ({
          tag_id: tt.tag_id,
          task_id: tt.task_id,
          tags: tt.tags,
        })),
      task_schedule: data.task_schedule || [],
      comments: (data.comments || []).map(comment => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
      })),
    };

    return getActionResponse({ data: taskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const createTaskAction = async (
  task: TablesInsert<"tasks">,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data: projectAccess, error: accessError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", task.project_id)
      .single();

    if (accessError || !projectAccess) throw new Error("Project access denied");

    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select(
        `
        *,
        project:projects (*),
        subtasks (*),
        task_tags (
          tags (*)
        ),
        task_schedule (*)
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data: data as TaskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const updateTaskAction = async (
  taskSlug: string,
  updates: TablesUpdate<"tasks">,
): Promise<ActionResponse<TaskWithDetails>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("slug", taskSlug)
      .select(
        `
        *,
        project:projects (*),
        subtasks (*),
        task_tags (
          tags (*)
        ),
        task_schedule (*)
      `,
      )
      .single();

    if (error) throw error;

    return getActionResponse({ data: data as TaskWithDetails });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const deleteTaskAction = async (
  taskSlug: string,
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("slug", taskSlug);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const reorderTasksAction = async (
  projectId: string,
  taskIds: string[],
): Promise<ActionResponse<null>> => {
  const supabase = await getSupabaseServerActionClient();

  try {
    // First get the existing tasks to preserve their data
    const { data: existingTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, prefix, slug, title")
      .in("id", taskIds);

    if (fetchError) throw fetchError;

    if (!existingTasks) throw new Error("Could not fetch existing tasks");

    // Create updates array with all required fields
    const updates = taskIds.map((id, index) => {
      const existingTask = existingTasks.find(task => task.id === id);
      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      return {
        id,
        ordinal_id: index + 1,
        project_id: projectId,
        prefix: existingTask.prefix,
        slug: existingTask.slug,
        title: existingTask.title,
      };
    });

    const { error } = await supabase.from("tasks").upsert(updates);

    if (error) throw error;

    return getActionResponse({ data: null });
  } catch (error) {
    return getActionResponse({ error });
  }
};
