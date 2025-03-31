// /stores/app.store.ts
import { getMockDataForProject, mockInitialAppState } from "@/lib/mock-data";
import {
  AppState,
  ContractWithMembers,
  MilestoneWithTasks,
  ProjectInvitationWithDetails,
  ProjectWithDetails,
  TaskWithAssignee,
} from "@/types/app.types";
import { isEqual } from "lodash";
import { create } from "zustand";

// Define a type for the state without actions
type AppStateWithoutActions = Omit<
  AppState,
  | "setUser"
  | "setProfile"
  | "setProjects"
  | "setProject"
  | "setTasks"
  | "setTask"
  | "setMilestones"
  | "setMilestone"
  | "setUserInvitations"
  | "setProjectInvitations"
  | "setSubscription"
  | "setAppRole"
  | "setProjectMemberRole"
  | "setContract"
  | "reset"
>;

// Create a data cache interface to store all modified data
interface DataCache {
  projects: { [id: string]: Partial<ProjectWithDetails> };
  milestones: { [id: string]: Partial<MilestoneWithTasks> };
  tasks: { [id: string]: Partial<TaskWithAssignee> };
  contracts: { [id: string]: Partial<ContractWithMembers> };
}

// Initialize empty cache
const initialCache: DataCache = {
  projects: {},
  milestones: {},
  tasks: {},
  contracts: {},
};

// Make sure the initial state conforms to the state without actions type
const initialState: AppStateWithoutActions = {
  ...mockInitialAppState,
  // Ensure array properties are initialized properly
  projects: mockInitialAppState.projects || [],
  tasks: mockInitialAppState.tasks || [],
  milestones: mockInitialAppState.milestones || [],
  userInvitations: mockInitialAppState.userInvitations || [],
  projectInvitations: mockInitialAppState.projectInvitations || [],
  // Use mockInitialAppState values
  user: mockInitialAppState.user || null,
  profile: mockInitialAppState.profile || null,
  project: mockInitialAppState.project || null,
  task: mockInitialAppState.task || null,
  milestone: mockInitialAppState.milestone || null,
  contract: mockInitialAppState.contract || null,
  appRole: mockInitialAppState.appRole || null,
  isAdmin: mockInitialAppState.isAdmin || false,
  projectMemberRole: mockInitialAppState.projectMemberRole || null,
};

// Updated getMockDataForProject function that checks the cache first
// Updated function in app.store.ts
// Update to the getDataFromCacheOrMock function in /stores/app.store.ts

const getDataFromCacheOrMock = (
  projectId: string,
  cache: DataCache,
  milestoneId?: string,
) => {
  // Try to get the project from cache first
  const cachedProject = cache.projects[projectId];

  // If the project doesn't exist in cache or mock data, return empty data
  if (
    !cachedProject &&
    !mockInitialAppState.projects.find(p => p.id === projectId)
  ) {
    return {
      tasks: [],
      project: null,
      milestone: null,
      milestones: [],
      contract: null,
      projectInvitations: [],
    };
  }

  // Get the data from mock service
  const mockData = getMockDataForProject(projectId, milestoneId);

  // Use either the cached project or get it from mock data
  const project = cachedProject || mockData.project;

  // Ensure project members are properly loaded from mock data if not in cache
  if (
    project &&
    (!project.project_members || project.project_members.length === 0)
  ) {
    // Make sure to fetch project members from mock data
    const mockProjectData = getMockDataForProject(projectId);
    if (mockProjectData.project && mockProjectData.project.project_members) {
      project.project_members = mockProjectData.project.project_members;
    }
  }

  // Get all cached milestones for this project
  const cachedMilestones = Object.values(cache.milestones).filter(
    m => m.project_id === projectId,
  );

  // Get milestones from mock data
  const mockMilestones = mockData.milestones;

  // Combine cached and mock milestones, prioritizing cached ones
  const mockMilestoneIds = new Set(mockMilestones.map(m => m.id));
  const cachedMilestoneIds = new Set(cachedMilestones.map(m => m.id));

  // Start with cached milestones
  const milestones = [...cachedMilestones];

  // Add mock milestones that aren't already cached
  mockMilestones.forEach(milestone => {
    if (milestone.id && !cachedMilestoneIds.has(milestone.id)) {
      milestones.push(milestone);
    }
  });

  // Find the specified milestone or the current milestone
  let currentMilestone: Partial<MilestoneWithTasks> | null = null;

  if (milestoneId) {
    // If a milestone ID was specified, check cache first
    currentMilestone =
      cache.milestones[milestoneId] ||
      milestones.find(m => m.id === milestoneId) ||
      null;
  } else {
    // Otherwise, use the project's current milestone
    const currentMilestoneId = project?.current_milestone_id;
    if (currentMilestoneId) {
      currentMilestone =
        cache.milestones[currentMilestoneId] ||
        milestones.find(m => m.id === currentMilestoneId) ||
        null;
    }

    // If still null, default to the first milestone if there is one
    if (!currentMilestone && milestones.length > 0) {
      currentMilestone = milestones[0];
    }
  }

  // Get contract from cache or mock data - UPDATED to use milestone_reference_id
  let contract: Partial<ContractWithMembers> | null = null;
  if (currentMilestone?.id) {
    // Try to find contracts with milestone_reference_id matching the current milestone
    const milestoneContracts = Object.values(cache.contracts).filter(
      c => c.milestone_reference_id === currentMilestone.id,
    );

    // Use the first found contract
    contract = milestoneContracts.length > 0 ? milestoneContracts[0] : null;

    // If not in cache, try from mock data
    if (!contract) {
      contract = mockData.contract;
      // Add to cache if found
      if (contract && contract.id) {
        cache.contracts[contract.id] = contract;
      }
    }
  }

  // If no milestone-specific contract, try project contract
  if (!contract) {
    const projectContractId = `contract-${projectId}`;
    contract = cache.contracts[projectContractId] || mockData.contract;
  }

  // Get tasks for the current milestone from cache or mock data
  let tasks: Partial<TaskWithAssignee>[] = [];
  if (currentMilestone?.id) {
    // First, try to get tasks directly from the milestone's tasks property
    if (currentMilestone.tasks && currentMilestone.tasks.length > 0) {
      tasks = currentMilestone.tasks as unknown as Partial<TaskWithAssignee>[];

      // Update task cache with these tasks
      tasks.forEach(task => {
        if (task.id) {
          cache.tasks[task.id] = task;
        }
      });
    } else {
      // Find cached tasks for this milestone
      const cachedTasks = Object.values(cache.tasks).filter(
        t => t.project_id === projectId,
      );

      // If there are cached tasks, filter by this milestone
      if (cachedTasks.length > 0) {
        // Try to find task IDs from the milestone
        const milestoneTaskIds =
          getMockDataForProject(
            projectId,
            currentMilestone.id,
          ).milestone?.tasks?.map(t => t.id) || [];

        // Filter tasks that belong to this milestone
        if (milestoneTaskIds.length > 0) {
          tasks = cachedTasks.filter(t =>
            milestoneTaskIds.includes(t.id || ""),
          );
        }
      }

      // If still no tasks, get from mock data
      if (tasks.length === 0) {
        tasks = getMockDataForProject(projectId, currentMilestone.id).tasks;

        // Update task cache with these tasks
        tasks.forEach(task => {
          if (task.id) {
            cache.tasks[task.id] = task;
          }
        });
      }
    }
  }

  // Get project invitations (these are part of the project object)
  const projectInvitations =
    project?.project_invitations || mockData.projectInvitations;

  return {
    tasks,
    project,
    milestone: currentMilestone,
    milestones,
    contract,
    projectInvitations,
  };
};

// Helper function to update an item in a collection
const updateItemInCollection = <T extends { id?: string | null }>(
  collection: T[],
  item: T,
): T[] => {
  if (!item.id) return collection;

  const itemExists = collection.some(i => i.id === item.id);

  if (itemExists) {
    return collection.map(i => (i.id === item.id ? item : i));
  } else {
    return [...collection, item];
  }
};

// Create the store with zustand
export const useAppStore = create<AppState>((set, get) => {
  // Create a cache to store all modified data
  const dataCache: DataCache = { ...initialCache };

  // Initialize cache with initial data
  initialState.projects.forEach(project => {
    if (project.id) {
      dataCache.projects[project.id] = project as Partial<ProjectWithDetails>;
    }
  });

  if (initialState.milestone?.id) {
    dataCache.milestones[initialState.milestone.id] = initialState.milestone;
  }

  if (initialState.contract?.id) {
    dataCache.contracts[initialState.contract.id] = initialState.contract;
  }

  initialState.tasks.forEach(task => {
    if (task.id) {
      dataCache.tasks[task.id] = task;
    }
  });

  // Initialize the state - ensure we properly sync tasks with the current milestone
  const initialMilestone = initialState.milestone;
  let initialTasks = initialState.tasks;

  if (
    initialMilestone &&
    initialMilestone.tasks &&
    initialMilestone.tasks.length > 0
  ) {
    // Use the tasks from the milestone directly with type assertion
    initialTasks =
      initialMilestone.tasks as unknown as Partial<TaskWithAssignee>[];
  } else if (initialMilestone && initialState.project?.id) {
    // Try to find tasks for this milestone from mock data
    const mockData = getMockDataForProject(
      initialState.project.id,
      initialMilestone.id,
    );
    if (mockData.tasks.length > 0) {
      initialTasks = mockData.tasks;
    }
  }

  return {
    ...initialState,
    tasks: initialTasks, // Use our synchronized tasks

    // User and authentication
    setUser: user => {
      if (!isEqual(get().user, user)) {
        set({ user });
      }
    },

    setProfile: profile => {
      if (!isEqual(get().profile, profile)) {
        const currentProjectId = profile?.current_project_id;

        // If the current project has changed, update all project-related data
        if (
          currentProjectId &&
          currentProjectId !== get().profile?.current_project_id
        ) {
          // First, cache the current state if we're switching projects
          const currentProject = get().project;
          const currentMilestone = get().milestone;
          const currentTasks = get().tasks;
          const currentContract = get().contract;

          // Cache current project data
          if (currentProject && currentProject.id) {
            dataCache.projects[currentProject.id] = currentProject;
          }

          // Cache current milestone with tasks
          if (currentMilestone && currentMilestone.id) {
            dataCache.milestones[currentMilestone.id] = {
              ...currentMilestone,
              tasks: currentTasks as unknown as TaskWithAssignee[],
            };
          }

          // Cache current contract
          if (currentContract && currentContract.id) {
            dataCache.contracts[currentContract.id] = currentContract;
          }

          // Now get data for the new project
          const projectData = getDataFromCacheOrMock(
            currentProjectId,
            dataCache,
          );

          // Ensure we have milestone-specific tasks
          let milestoneTasks = projectData.tasks || [];

          // If the milestone has its own tasks array, use those tasks
          if (
            projectData.milestone?.tasks &&
            projectData.milestone.tasks.length > 0
          ) {
            milestoneTasks = projectData.milestone.tasks;
          }

          set({
            profile,
            user: get().user,
            tasks: milestoneTasks,
            project: projectData.project,
            milestone: projectData.milestone,
            milestones: projectData.milestones || [],
            contract: projectData.contract,
            projectInvitations:
              (projectData.projectInvitations as Partial<ProjectInvitationWithDetails>[]) ||
              [],
            task: null, // Reset current task when changing projects
          });
        } else {
          set({ profile });
        }
      }
    },

    // Projects management
    setProjects: projects => {
      if (!isEqual(get().projects, projects)) {
        // Update cache with new projects
        projects.forEach(project => {
          if (project.id) {
            dataCache.projects[project.id] =
              project as Partial<ProjectWithDetails>;
          }
        });

        set({ projects: projects || [] });
      }
    },

    setProject: project => {
      if (!isEqual(get().project, project)) {
        // Update project in cache if it has an ID
        if (project && project.id) {
          dataCache.projects[project.id] = project;

          // When setting a new current project, also update the profile's current_project_id
          const profile = get().profile;
          const currentProjectId = profile?.current_project_id;

          // Save data for the current project before switching
          const currentProject = get().project;
          const currentMilestone = get().milestone;
          const currentTasks = get().tasks;
          const currentContract = get().contract;

          // Cache current project data
          if (currentProject && currentProject.id) {
            dataCache.projects[currentProject.id] = currentProject;
          }

          // Cache current milestone with tasks
          if (currentMilestone && currentMilestone.id) {
            dataCache.milestones[currentMilestone.id] = {
              ...currentMilestone,
              tasks: currentTasks as unknown as TaskWithAssignee[],
            };
          }

          // Cache current contract
          if (currentContract && currentContract.id) {
            dataCache.contracts[currentContract.id] = currentContract;
          }

          // If this is a different project than the current one, update all project-related data
          if (project.id !== currentProjectId) {
            const projectData = getDataFromCacheOrMock(project.id, dataCache);

            // Ensure we have milestone-specific tasks
            let milestoneTasks = projectData.tasks || [];

            // If the milestone has its own tasks array, use those tasks
            if (
              projectData.milestone?.tasks &&
              projectData.milestone.tasks.length > 0
            ) {
              milestoneTasks = projectData.milestone
                .tasks as unknown as Partial<TaskWithAssignee>[];
            }

            set({
              project: projectData.project,
              tasks: milestoneTasks,
              milestone: projectData.milestone,
              milestones: projectData.milestones || [],
              contract: projectData.contract,
              projectInvitations:
                (projectData.projectInvitations as Partial<ProjectInvitationWithDetails>[]) ||
                [],
              profile: {
                ...profile,
                current_project_id: project.id,
              },
              task: null, // Reset current task when changing projects
            });
          } else {
            // Update the current project and sync with projects collection
            const updatedProjects = updateItemInCollection(
              get().projects,
              project,
            );
            set({
              project,
              projects: updatedProjects,
            });
          }
        } else {
          set({ project });
        }
      }
    },

    // Tasks management
    setTasks: tasks => {
      const tasksToSet = tasks ?? [];
      if (!isEqual(get().tasks, tasksToSet)) {
        // Update tasks in cache
        tasksToSet.forEach(task => {
          if (task.id) {
            dataCache.tasks[task.id] = task;
          }
        });

        set({ tasks: tasksToSet });

        // Also update the tasks in the current milestone if applicable
        const currentMilestone = get().milestone;
        if (currentMilestone && currentMilestone.id) {
          // Use type assertion to handle the tasks assignment properly
          const updatedMilestone = {
            ...currentMilestone,
            tasks: tasksToSet as unknown as TaskWithAssignee[],
          };

          dataCache.milestones[currentMilestone.id] = updatedMilestone;

          const updatedMilestones = updateItemInCollection(
            get().milestones,
            updatedMilestone,
          );

          set({
            milestone: updatedMilestone,
            milestones: updatedMilestones,
          });
        }
      }
    },

    setTask: task => {
      if (!isEqual(get().task, task)) {
        // Update task in cache
        if (task && task.id) {
          dataCache.tasks[task.id] = task;

          // Sync with tasks collection
          const updatedTasks = updateItemInCollection(get().tasks, task);
          set({
            task,
            tasks: updatedTasks,
          });
        } else {
          set({ task });
        }
      }
    },

    // Milestones management
    setMilestones: milestones => {
      const milestonesToSet = milestones ?? [];
      if (!isEqual(get().milestones, milestonesToSet)) {
        // Update milestones in cache
        milestonesToSet.forEach(milestone => {
          if (milestone.id) {
            // Preserve tasks if they exist in the cache
            const existingMilestoneInCache = dataCache.milestones[milestone.id];
            if (existingMilestoneInCache && existingMilestoneInCache.tasks) {
              dataCache.milestones[milestone.id] = {
                ...milestone,
                tasks: existingMilestoneInCache.tasks,
              };
            } else {
              dataCache.milestones[milestone.id] = milestone;
            }
          }
        });

        set({ milestones: milestonesToSet });
      }
    },

    setMilestone: milestone => {
      if (!isEqual(get().milestone, milestone)) {
        // First cache current milestone data if there is one
        const currentMilestone = get().milestone;
        const currentTasks = get().tasks;
        const currentContract = get().contract;

        // If we have a current milestone, save its state to cache before changing
        if (currentMilestone && currentMilestone.id) {
          // Cache tasks for the current milestone
          dataCache.milestones[currentMilestone.id] = {
            ...currentMilestone,
            tasks: currentTasks as unknown as TaskWithAssignee[],
          };

          // Cache the contract if it's associated with this milestone
          if (
            currentContract &&
            currentContract.milestone_reference_id === currentMilestone.id &&
            currentContract.id
          ) {
            dataCache.contracts[currentContract.id] = currentContract;
          }
        }

        // Update milestone in cache if it has an ID
        if (milestone && milestone.id) {
          dataCache.milestones[milestone.id] = milestone;

          // Sync with milestones collection
          const updatedMilestones = updateItemInCollection(
            get().milestones,
            milestone,
          );
          set({
            milestone,
            milestones: updatedMilestones,
          });
        }

        // If milestone is null, we don't need to filter tasks
        if (!milestone) {
          set({ milestone, task: null, contract: null });
          return;
        }

        // Get the current project
        const currentProject = get().project;
        if (!currentProject || !currentProject.id) {
          set({ milestone });
          return;
        }

        // Get data from cache or mock data
        const projectData = getDataFromCacheOrMock(
          currentProject.id,
          dataCache,
          milestone.id,
        );

        // Get milestone-specific contract if available
        let milestoneContract = projectData.contract;

        // Get tasks for this milestone
        let milestoneTasks: Partial<TaskWithAssignee>[] = [];

        // First check if the milestone itself has tasks
        if (milestone.tasks && milestone.tasks.length > 0) {
          milestoneTasks = milestone.tasks;
        }
        // Then check if the projectData has tasks
        else if (projectData.tasks && projectData.tasks.length > 0) {
          milestoneTasks = projectData.tasks;
        }
        // Finally, fetch directly from mock data as a fallback
        else if (currentProject.id && milestone.id) {
          const mockData = getMockDataForProject(
            currentProject.id,
            milestone.id,
          );
          milestoneTasks = mockData.tasks || [];
        }

        // Update milestone, tasks, and contract
        set({
          milestone,
          tasks: milestoneTasks,
          task: null, // Reset current task when changing milestone
          contract: milestoneContract, // Update the contract based on the milestone
        });

        // If this is the current milestone, update the project's current_milestone_id
        if (milestone.is_current && currentProject) {
          const updatedProject = {
            ...currentProject,
            current_milestone_id: milestone.id,
          };

          // Update project in cache
          if (currentProject.id) {
            dataCache.projects[currentProject.id] = updatedProject;
          }

          // Update project and sync with projects collection
          const updatedProjects = updateItemInCollection(
            get().projects,
            updatedProject,
          );
          set({
            project: updatedProject,
            projects: updatedProjects,
          });
        }
      }
    },

    // Invitations management
    setUserInvitations: userInvitations => {
      if (!isEqual(get().userInvitations, userInvitations)) {
        set({ userInvitations: userInvitations || [] });
      }
    },

    setProjectInvitations: projectInvitations => {
      if (!isEqual(get().projectInvitations, projectInvitations)) {
        // Update project invitations in the project cache
        const currentProject = get().project;
        if (currentProject && currentProject.id) {
          const updatedProject = {
            ...currentProject,
            project_invitations: projectInvitations,
          };

          dataCache.projects[currentProject.id] = updatedProject;

          // Sync with projects collection
          const updatedProjects = updateItemInCollection(
            get().projects,
            updatedProject,
          );
          set({
            project: updatedProject,
            projects: updatedProjects,
            projectInvitations: projectInvitations || [],
          });
        } else {
          set({ projectInvitations: projectInvitations || [] });
        }
      }
    },

    // Roles management
    setAppRole: appRole => {
      if (!isEqual(get().appRole, appRole)) {
        set({
          appRole,
          isAdmin: appRole === "admin",
        });
      }
    },

    setProjectMemberRole: projectMemberRole => {
      if (!isEqual(get().projectMemberRole, projectMemberRole)) {
        set({ projectMemberRole });
      }
    },

    // Contract management - UPDATED for milestone_reference_id and enhanced persistence
    setContract: contract => {
      if (!isEqual(get().contract, contract)) {
        // Update contract in cache
        if (contract && contract.id) {
          dataCache.contracts[contract.id] = contract;

          // If this contract is associated with the current milestone, update milestone.contract
          const currentMilestone = get().milestone;
          if (
            currentMilestone &&
            contract.milestone_reference_id === currentMilestone.id
          ) {
            const updatedMilestone = {
              ...currentMilestone,
              contract: contract,
            };

            // Update milestone in cache
            if (currentMilestone.id) {
              dataCache.milestones[currentMilestone.id] = updatedMilestone;
            }

            // Sync with milestones collection
            const updatedMilestones = updateItemInCollection(
              get().milestones,
              updatedMilestone,
            );
            set({
              milestone: updatedMilestone,
              milestones: updatedMilestones,
              contract,
            });
            return;
          }
        }

        set({ contract });
      }
    },

    // Reset state to initial values
    reset: () => {
      // Clear cache
      Object.keys(dataCache).forEach(key => {
        dataCache[key as keyof DataCache] = {};
      });

      // Ensure proper initialization of tasks when resetting
      const resetMilestone = initialState.milestone;
      let resetTasks = initialState.tasks;

      // If we have a milestone with tasks, use those tasks
      if (
        resetMilestone &&
        resetMilestone.tasks &&
        resetMilestone.tasks.length > 0
      ) {
        resetTasks = resetMilestone.tasks;
      } else if (resetMilestone && initialState.project?.id) {
        // Try to find tasks from mock data
        const mockData = getMockDataForProject(
          initialState.project.id,
          resetMilestone.id,
        );
        if (mockData.tasks.length > 0) {
          resetTasks = mockData.tasks;
        }
      }

      // Reset state with proper tasks
      set({
        ...initialState,
        tasks: resetTasks,
      });
    },
  };
});

// Utility hook for accessing app data
export const useAppData = (): AppState => {
  const store = useAppStore();
  return store;
};
