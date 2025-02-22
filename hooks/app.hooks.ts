import { getAppDataAction, getTaskAction } from "@/actions/app.actions";
import { conditionalLog } from "@/lib/log.utils";
import { useAppStore } from "@/stores/app.store";
import { AppState, TaskComplete } from "@/types/app.types";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

interface QueryConfig<TData>
  extends Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn"> {}

type AppStateWithoutTask = Omit<AppState, "task">;

export const useGetAppData = (
  initialData?: AppStateWithoutTask | null,
  config?: QueryConfig<AppStateWithoutTask | null>,
) => {
  const hookName = "useGetAppData";
  const {
    setUser,
    setProfile,
    setProjects,
    setProject,
    setTasks,
    setInvitations,
  } = useAppStore();

  return useQuery({
    queryKey: ["appData"],
    queryFn: async () => {
      const { data, error } = await getAppDataAction();
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);

      // Update store with fetched data
      if (data) {
        setProfile(data.profile);
        setProjects(data.projects);
        setProject(data.project);
        setTasks(data.tasks);
        setInvitations(data.invitations);
      }

      return data;
    },
    initialData,
    staleTime: 1000 * 60, // 1 minute
    ...config,
  });
};

export const useGetTask = (
  taskIdentifier: string,
  initialData?: TaskComplete | null,
  config?: QueryConfig<TaskComplete | null>,
) => {
  const hookName = "useGetTask";
  const { setTask } = useAppStore();

  return useQuery({
    queryKey: ["task", taskIdentifier],
    queryFn: async () => {
      const { data, error } = await getTaskAction(taskIdentifier);
      conditionalLog(hookName, { data, error }, false);
      if (error) throw new Error(error);

      // Update store with fetched task data
      if (data) {
        setTask(data);
      }

      return data;
    },
    initialData,
    staleTime: 1000 * 60, // 1 minute
    enabled: !!taskIdentifier,
    ...config,
  });
};
