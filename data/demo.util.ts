import { Tables } from "@/types/database.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { demoData, demoProjects, teamMembers } from "./demo.db";

export interface ParsedDemoData {
  project: ProjectWithDetails | null;
  task: TaskResult | null;
  profile: Tables<"profiles"> | null;
  projects: ProjectWithDetails[];
  notifications: Tables<"notifications">[];
}

export const USER_ID = "admin-user-id";

type ProjectId = "proj-1" | "proj-2" | "proj-3";

function isValidProjectId(id: string): id is ProjectId {
  return ["proj-1", "proj-2", "proj-3"].includes(id);
}

const teamMemberAllocation: Record<ProjectId, typeof teamMembers> = {
  "proj-1": [demoData.adminProfile, ...teamMembers.slice(0, 4)],
  "proj-2": [demoData.adminProfile, ...teamMembers.slice(4, 8)],
  "proj-3": [demoData.adminProfile, ...teamMembers.slice(8, 15)],
};

function isProjectMember(projectId: string, userId: string): boolean {
  if (!isValidProjectId(projectId)) return false;
  return teamMemberAllocation[projectId].some(member => member.id === userId);
}

function getProjectMembers(projectId: string) {
  if (!isValidProjectId(projectId)) {
    return [];
  }
  return teamMemberAllocation[projectId].map(member => ({
    id: `member-${member.id}`,
    project_id: projectId,
    user_id: member.id,
    role: member.id === USER_ID ? "owner" : "member",
    created_at: new Date().toISOString(),
    profile: member,
  }));
}

function getProjectNotifications(projectId: string): Tables<"notifications">[] {
  switch (projectId) {
    case "proj-1":
      return demoData.notifications.project1;
    case "proj-2":
      return demoData.notifications.project2;
    case "proj-3":
      return demoData.notifications.project3;
    default:
      return [];
  }
}

export function getDraftTask(projectId: string): TaskResult {
  const project = demoData.projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const projectMembers = getProjectMembers(projectId);

  const nextOrdinalId =
    Math.max(
      ...Object.values(demoData.tasks)
        .flat()
        .filter(t => t.task.project_id === projectId)
        .map(t => t.task.ordinal_id),
      0,
    ) + 1;

  return {
    task: {
      id: `draft-task-${Date.now()}`,
      title: "",
      description: "",
      status: "draft" as Tables<"tasks">["status"],
      priority: "medium" as Tables<"tasks">["priority"],
      project_id: projectId,
      assignee: null,
      prefix: project.prefix,
      slug: `${project.prefix.toLowerCase()}-${nextOrdinalId}`,
      ordinal_id: nextOrdinalId,
      ordinal_priority: nextOrdinalId,
      budget_cents: 0,
      estimated_minutes: null,
      recorded_minutes: null,
      start_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    subtasks: [],
    comments: [],
    task_schedule: {
      id: `draft-schedule-${Date.now()}`,
      task_id: `draft-task-${Date.now()}`,
      start_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_hours: null,
      actual_hours: null,
      completed_at: null,
    },
    assignee_profile: null,
    project: project,
  };
}

export function getDraftProject(): ProjectWithDetails {
  const nextProjectNumber = demoProjects.length + 1;

  return {
    id: `draft-proj-${Date.now()}`,
    name: "",
    description: "",
    status: "active" as const,
    slug: `project-${nextProjectNumber}`,
    prefix: `P${nextProjectNumber}`,
    github_repo_url: "",
    github_owner: "",
    github_repo: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project_members: [],
    project_invitations: [],
    tasks: [],
    icon_color_bg: "gray",
    icon_color_fg: "white",
    icon_name: "lucide:code-2",
  };
}

function findTaskByIdentifier(
  tasks: TaskResult[],
  identifier: string,
): TaskResult | null {
  // First try to parse as ordinal_id (number)
  const ordinalId = parseInt(identifier, 10);
  if (!isNaN(ordinalId)) {
    return tasks.find(t => t.task.ordinal_id === ordinalId) || null;
  }
  // If not a number, try to match by slug
  return tasks.find(t => t.task.slug === identifier) || null;
}

export function getDemoDataFromPath(pathname: string): ParsedDemoData {
  const result: ParsedDemoData = {
    project: null,
    task: null,
    profile: demoData.adminProfile,
    projects: demoData.projects.map(p => ({
      ...p,
      project_members: getProjectMembers(p.id),
      project_invitations: [],
      tasks: [],
    })),
    notifications: [],
  };

  const segments = pathname.split("/").filter(Boolean);
  const pathIsHome = pathname === "/";

  if (pathIsHome || segments.length === 0) {
    result.project = {
      ...demoData.projects[1],
      project_members: getProjectMembers("proj-2"),
      project_invitations: [],
      tasks: demoData.tasks.project2 as TaskResult[],
    };
    result.notifications = getProjectNotifications("proj-2");
    return result;
  }

  if (segments[0] === "projects" && segments[1] === "new") {
    result.project = getDraftProject();
    return result;
  }

  const projectSlug = segments[0];

  const project = demoData.projects.find(p => p.slug === projectSlug);
  if (!project) {
    const defaultProject = demoData.projects[0];
    result.project = {
      ...defaultProject,
      project_members: getProjectMembers(defaultProject.id),
      project_invitations: [],
      tasks: demoData.tasks.project1 as TaskResult[],
    };
    result.notifications = getProjectNotifications("proj-1");

    result.projects = result.projects.map((p, i) => ({
      ...p,
      tasks:
        i === 0
          ? (demoData.tasks.project1 as TaskResult[])
          : i === 1
            ? (demoData.tasks.project2 as TaskResult[])
            : i === 2
              ? (demoData.tasks.project3 as TaskResult[])
              : [],
    }));

    return result;
  }

  const projectTasks = ({
    "proj-1": demoData.tasks.project1,
    "proj-2": demoData.tasks.project2,
    "proj-3": demoData.tasks.project3,
  }[project.id] || []) as TaskResult[];

  result.project = {
    ...project,
    project_members: getProjectMembers(project.id),
    project_invitations: [],
    tasks: projectTasks,
  };

  result.notifications = getProjectNotifications(project.id);

  if (
    segments.length >= 3 &&
    segments[1] === "tasks" &&
    segments[2] === "new"
  ) {
    result.task = getDraftTask(project.id);
    return result;
  }

  if (segments.length > 1 && segments[1] !== "tasks") {
    const taskIdentifier = segments[1];
    result.task = findTaskByIdentifier(projectTasks, taskIdentifier);
  }

  return result;
}

export { getProjectMembers, getProjectNotifications, isProjectMember };
