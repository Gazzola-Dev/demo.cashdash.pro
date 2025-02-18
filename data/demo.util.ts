import { Tables } from "@/types/database.types";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";
import { demoData, demoProjects, teamMembers } from "./demo.db";

export interface ParsedDemoData {
  project: ProjectWithDetails | null;
  task: TaskResult | null;
  profile: Tables<"profiles"> | null;
  projects: ProjectWithDetails[];
}

export const USER_ID = "admin-user-id";

export function getDraftTask(projectId: string): TaskResult {
  const project = demoData.projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const nextOrdinalId =
    Math.max(
      ...Object.values(demoData.tasks)
        .flat()
        .filter(t => t.task.project_id === projectId)
        .map(t => t.task.ordinal_id),
    ) + 1;

  return {
    task: {
      id: `draft-task-${Date.now()}`,
      title: "",
      description: "",
      status: "draft",
      priority: "medium",
      project_id: projectId,
      assignee: null,
      prefix: project.prefix,
      slug: `${project.prefix.toLowerCase()}-${nextOrdinalId}`,
      ordinal_id: nextOrdinalId,
      budget_cents: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    subtasks: [],
    comments: [],
    task_schedule: {
      id: `draft-schedule-${Date.now()}`,
      task_id: `draft-task-${Date.now()}`,
      start_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      estimated_hours: 0,
      actual_hours: 0,
      completed_at: null,
    },
    assignee_profile: null,
    project: project,
  };
}

// Define valid project IDs type
type ProjectId = "proj-1" | "proj-2" | "proj-3";

// Type guard to check if a string is a valid ProjectId
function isValidProjectId(id: string): id is ProjectId {
  return ["proj-1", "proj-2", "proj-3"].includes(id);
}

// Divide team members among projects, including admin in all projects
const teamMemberAllocation: Record<ProjectId, typeof teamMembers> = {
  "proj-1": [demoData.adminProfile, ...teamMembers.slice(0, 4)], // GoTask - 5 members (including admin)
  "proj-2": [demoData.adminProfile, ...teamMembers.slice(4, 8)], // Eco3D - 5 members (including admin)
  "proj-3": [demoData.adminProfile, ...teamMembers.slice(8, 15)], // Menu.run - 8 members (including admin)
};

// Function to get team members for a project
function getProjectMembers(projectId: string) {
  if (!isValidProjectId(projectId)) {
    return []; // Return empty array for invalid project IDs
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

export function getDemoDataFromPath(pathname: string): ParsedDemoData {
  // Initialize return object
  const result: ParsedDemoData = {
    project: {
      ...demoData.projects[1],
      tasks: demoData.tasks?.project2.map(t => t.task) || [],
      project_members: getProjectMembers("proj-2"),
      project_invitations: [],
    },
    task: null,
    profile: demoData.adminProfile,
    projects: demoData.projects.map(p => ({
      ...p,
      project_members: getProjectMembers(p.id),
      project_invitations: [],
      tasks: [],
    })),
  };

  // Split path into segments and remove empty strings
  const segments = pathname.split("/").filter(Boolean);
  // Return early if no segments
  if (segments.length === 0) {
    return result;
  }

  // Handle "/projects/new" path
  if (segments[0] === "projects" && segments[1] === "new") {
    result.project = getDraftProject();
    return result;
  }

  // First segment is always project slug (except for /projects/new)
  const projectSlug = segments[0];

  // Find matching project from demo data
  const project = demoData.projects.find(p => p.slug === projectSlug);
  if (!project) {
    return {
      project: {
        ...demoData.projects[0],
        tasks: demoData.tasks.project1.map(t => t.task),
        project_invitations: [],
        project_members: getProjectMembers("proj-1"),
      },
      task: null,
      profile: demoData.adminProfile,
      projects: demoData.projects.map((p, i) => ({
        ...p,
        project_members: getProjectMembers(p.id),
        project_invitations: [],
        tasks: (i === 0
          ? demoData.tasks.project1
          : i === 1
            ? demoData.tasks.project2
            : i === 2
              ? demoData.tasks.project3
              : []
        ).map(t => t.task),
      })),
    };
  }

  // Get all tasks for this project with full details
  const allProjectTasks = [
    ...demoData.tasks.project1,
    ...demoData.tasks.project2,
    ...demoData.tasks.project3,
  ].filter(task => task.project?.id === project.id);

  // Build the full project object with complete task details and allocated members
  result.project = {
    ...project,
    project_members: getProjectMembers(project.id),
    project_invitations: [],
    tasks: allProjectTasks.map(taskResult => ({
      ...taskResult.task,
      assignee: taskResult.assignee_profile?.id || null,
    })),
  };

  // Handle "/[project_slug]/tasks/new" path
  if (
    segments.length >= 3 &&
    segments[1] === "tasks" &&
    segments[2] === "new"
  ) {
    result.task = getDraftTask(project.id);
    return result;
  }

  // If there's a second segment and it's not "tasks/new", it's a task slug
  if (segments.length > 1 && segments[1] !== "tasks") {
    const taskSlug = segments[1];
    result.task = allProjectTasks.find(t => t.task.slug === taskSlug) || null;
  }

  return result;
}

export function getDraftProject(): ProjectWithDetails {
  const nextProjectNumber = demoProjects.length + 1;

  return {
    id: `draft-proj-${Date.now()}`,
    name: "",
    description: "",
    status: "active",
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
