import demoData from "@/data/demo.db";
import { ProjectWithDetails } from "@/types/project.types";
import { TaskResult } from "@/types/task.types";

export interface ParsedDemoData {
  project: ProjectWithDetails | null;
  task: TaskResult | null;
}

export function getDemoDataFromPath(pathname: string): ParsedDemoData {
  // Initialize return object
  const result: ParsedDemoData = {
    project: null,
    task: null,
  };

  // Split path into segments and remove empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Return early if no segments
  if (!segments.length) {
    return result;
  }

  // First segment is always project slug
  const projectSlug = segments[0];

  // Find matching project from demo data
  const project = demoData.projects.find(p => p.slug === projectSlug);
  if (!project) {
    return result;
  }

  // Build full project details
  const projectMembers = demoData.teamMembers.map(member => ({
    id: `member-${member.id}`,
    project_id: project.id,
    user_id: member.id,
    role: "member",
    created_at: new Date().toISOString(),
    profile: member,
  }));

  // Get all tasks for this project with full details
  const allProjectTasks = [
    ...demoData.tasks.project1,
    ...demoData.tasks.project2,
    ...demoData.tasks.project3,
  ].filter(task => task.project?.id === project.id);

  // Build the full project object with complete task details
  result.project = {
    ...project,
    project_members: projectMembers,
    project_invitations: [],
    tasks: allProjectTasks.map(taskResult => ({
      ...taskResult.task,
      assignee: taskResult.assignee_profile?.id || null,
    })),
  };

  // If there's a second segment, it's a task slug
  if (segments.length > 1) {
    const taskSlug = segments[1];
    result.task = allProjectTasks.find(t => t.task.slug === taskSlug) || null;
  }

  return result;
}
