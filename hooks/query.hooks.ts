import { getUserInvitesAction } from "@/actions/invite.actions";
import { getProfileAction } from "@/actions/profile.actions";
import {
  getProjectAction,
  listProjectsAction,
} from "@/actions/project.actions";
import {
  getTaskAction,
  listTasksAction,
  upsertDraftTaskAction,
} from "@/actions/task.actions";
import { useGetUser } from "@/hooks/user.hooks";
import { conditionalLog } from "@/lib/log.utils";
import { UserInvites } from "@/types/invites.types";
import { ProfileWithDetails } from "@/types/profile.types";
import { Project, ProjectWithDetails } from "@/types/project.types";
import { TaskFilters, TaskResult } from "@/types/task.types";
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// Default stale time for queries (5 minutes)
const DEFAULT_STALE_TIME = 1000 * 60 * 5;

// Reusable error handler type
type QueryErrorHandler = (error: Error) => void;

interface QueryConfig<TData>
  extends Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn"> {}

export const useGetProfile = (
  initialData?: ProfileWithDetails | null,
  config?: QueryConfig<ProfileWithDetails | null>,
) => {
  const hookName = "useGetProfile";

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await getProfileAction();
      conditionalLog(hookName, { data, error }, false, 10);
      if (error) throw new Error(error);
      return data;
    },
    initialData,
    staleTime: 1000 * 60,
    ...config,
  });
};

export const useListProjects = (
  filters?: {
    status?: Project["status"];
    search?: string;
    sort?: keyof Project;
    order?: "asc" | "desc";
  },
  config?: QueryConfig<ProjectWithDetails[]>,
) => {
  const hookName = "useListProjects";
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const { data, error } = await listProjectsAction(filters);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};

export const useGetProject = (
  projectSlug?: string,
  config?: QueryConfig<ProjectWithDetails | null>,
) => {
  const hookName = "useGetProject";
  const { data: profile } = useGetProfile();
  const queryClient = useQueryClient();
  const slug = projectSlug || profile?.current_project?.slug || "";

  return useQuery({
    queryKey: ["project", projectSlug],
    queryFn: async () => {
      if (!slug) throw new Error("No project slug provided");
      const { data, error } = await getProjectAction(slug);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!slug,
    placeholderData: () => {
      const projectsData = queryClient.getQueryData<ProjectWithDetails[]>([
        "projects",
      ]);
      return projectsData?.find(p => p.slug === slug);
    },
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};

export const useGetTask = (
  taskSlug: string,
  {
    initialData,
    ...config
  }: { initialData?: TaskResult } & QueryConfig<TaskResult> = {},
) => {
  const hookName = "useGetTask";
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["task", taskSlug],
    queryFn: async () => {
      const { data, error } = await getTaskAction(taskSlug);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);
      if (!data) throw new Error("Task not found");
      return data;
    },
    enabled: !!taskSlug,
    initialData,
    placeholderData: () => {
      const tasksData = queryClient.getQueryData<TaskResult[]>(["tasks"]);
      return tasksData?.find(t => t.task.slug === taskSlug);
    },
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};

export const useListTasks = (
  filters?: TaskFilters,
  config?: QueryConfig<TaskResult[]>,
) => {
  const hookName = "useListTasks";

  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { data, error } = await listTasksAction(filters);
      conditionalLog(hookName, { data, error });
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!filters?.projectSlug,
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};

export const useGetDraftTask = (
  projectSlug: string,
  config?: QueryConfig<TaskResult | null>,
) => {
  const hookName = "useGetDraftTask";

  return useQuery({
    queryKey: ["draft-task", projectSlug],
    queryFn: async () => {
      const { data, error } = await upsertDraftTaskAction(projectSlug);
      conditionalLog(hookName, { data, error });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!projectSlug,
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};

export const useGetUserInvites = (
  config?: QueryConfig<UserInvites | null>,
): UseQueryResult<UserInvites | null, Error> => {
  const hookName = "useGetUserInvites";
  const { data: user } = useGetUser();

  return useQuery<UserInvites | null, Error>({
    queryKey: ["user-invites"],
    queryFn: async () => {
      if (!user?.email) throw new Error("Not authenticated");
      const { data, error } = await getUserInvitesAction();
      conditionalLog(hookName, { data, error }, false);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
    staleTime: DEFAULT_STALE_TIME,
    ...config,
  });
};
